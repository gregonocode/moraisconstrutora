// app/api/orcamentos/inteligente/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { buildAnthropicMessages } from "@/app/lib/orcamentos-inteligentes/prompt";
import {
  extractJsonFromModelResponse,
  intelligentBudgetInputSchema,
  intelligentBudgetContextSchema,
  normalizeAiBudgetOutput,
  mapNormalizedDraftToOrcamentosTable,
  type IntelligentBudgetContext,
} from "@/app/lib/orcamentos-inteligentes/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnthropicTextBlock = {
  type: string;
  text?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsedInput = intelligentBudgetInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos para geração do orçamento inteligente.",
          details: parsedInput.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = parsedInput.data;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: usuarioRow, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, nome")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (usuarioError) {
      return NextResponse.json(
        { error: `Erro ao buscar usuário interno: ${usuarioError.message}` },
        { status: 500 }
      );
    }

    if (!usuarioRow) {
      return NextResponse.json(
        { error: "Usuário interno não encontrado." },
        { status: 404 }
      );
    }

    const userId = usuarioRow.id as string;

    if (input.userId !== userId) {
      return NextResponse.json(
        { error: "userId do payload não corresponde ao usuário autenticado." },
        { status: 403 }
      );
    }

    const context = await buildGenerationContext({
      supabase,
      userId,
      empresaId: input.empresaId ?? null,
      tipoObra: input.tipoObra,
      descricaoSolicitacao: input.descricaoSolicitacao,
    });

    const validatedContext = intelligentBudgetContextSchema.parse(context);

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const { system, user: userPrompt } = buildAnthropicMessages({
      input,
      context: validatedContext,
    });

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        temperature: 0.3,
        system,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return NextResponse.json(
        {
          error: "Falha ao chamar a Anthropic.",
          details: errorText,
        },
        { status: 502 }
      );
    }

    const anthropicJson = await anthropicResponse.json();

    const responseText = extractTextFromAnthropicResponse(anthropicJson);
    if (!responseText) {
      return NextResponse.json(
        {
          error: "A resposta da Anthropic não trouxe conteúdo textual utilizável.",
        },
        { status: 502 }
      );
    }

    const extractedJson = extractJsonFromModelResponse(responseText);
    if (!extractedJson) {
      return NextResponse.json(
        {
          error: "Não foi possível extrair JSON válido da resposta da IA.",
          raw: responseText,
        },
        { status: 502 }
      );
    }

    const normalizedDraft = normalizeAiBudgetOutput(extractedJson);

    const clienteId = input.clienteId ?? null;
    const empresaId = input.empresaId ?? null;

    const validadeEm = addDaysAsIsoDate(normalizedDraft.validadeDias);

    const orcamentoPayload = {
      user_id: userId,
      empresa_id: empresaId,
      cliente_id: clienteId,
      codigo: null,
      status: "rascunho",
      validade_em: validadeEm,
      ...mapNormalizedDraftToOrcamentosTable(normalizedDraft),
    };

    const { data: insertedOrcamento, error: insertOrcamentoError } = await supabase
      .from("orcamentos")
      .insert(orcamentoPayload)
      .select("id")
      .single();

    if (insertOrcamentoError || !insertedOrcamento) {
      return NextResponse.json(
        {
          error: "Erro ao salvar orçamento.",
          details: insertOrcamentoError?.message ?? "Insert retornou vazio.",
        },
        { status: 500 }
      );
    }

    const orcamentoId = insertedOrcamento.id as string;

    const etapaIdByOrder = new Map<number, string>();

    if (normalizedDraft.etapas.length > 0) {
      const etapasPayload = normalizedDraft.etapas.map((etapa) => ({
        user_id: userId,
        orcamento_id: orcamentoId,
        nome: etapa.nome,
        descricao: buildStageDescription(etapa),
        ordem: etapa.ordem,
        valor_total: etapa.valorTotal,
      }));

      const { data: insertedEtapas, error: insertEtapasError } = await supabase
        .from("orcamento_etapas")
        .insert(etapasPayload)
        .select("id, ordem");

      if (insertEtapasError) {
        return NextResponse.json(
          {
            error: "Erro ao salvar etapas do orçamento.",
            details: insertEtapasError.message,
            orcamento_id: orcamentoId,
          },
          { status: 500 }
        );
      }

      for (const etapa of insertedEtapas ?? []) {
        etapaIdByOrder.set(etapa.ordem as number, etapa.id as string);
      }
    }

    if (normalizedDraft.itens.length > 0) {
      const itensPayload = normalizedDraft.itens.map((item, index) => ({
        user_id: userId,
        orcamento_id: orcamentoId,
        etapa_id:
          item.etapaOrdemRef && etapaIdByOrder.has(item.etapaOrdemRef)
            ? etapaIdByOrder.get(item.etapaOrdemRef) ?? null
            : null,
        tipo_item: mapTipoItemForDatabase(item.tipoItem),
        material_id: null,
        servico_id: null,
        composicao_id: null,
        descricao: buildItemDescription(item),
        unidade_medida_id: null,
        quantidade: item.quantidade,
        custo_unitario: item.custoUnitario,
        venda_unitaria: item.vendaUnitaria,
        ordem: index + 1,
      }));

      const { error: insertItensError } = await supabase
        .from("orcamento_itens")
        .insert(itensPayload);

      if (insertItensError) {
        return NextResponse.json(
          {
            error: "Erro ao salvar itens do orçamento.",
            details: insertItensError.message,
            orcamento_id: orcamentoId,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      orcamento_id: orcamentoId,
      status: "rascunho",
      resumo: {
        titulo: normalizedDraft.titulo,
        valor_total: normalizedDraft.valorTotal,
        custo_total: normalizedDraft.custoTotal,
        margem_lucro: normalizedDraft.margemLucroPercentual,
        etapas: normalizedDraft.etapas.length,
        itens: normalizedDraft.itens.length,
      },
      ia: {
        raw_text_preview: responseText.slice(0, 1500),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao gerar orçamento inteligente.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

async function buildGenerationContext({
  supabase,
  userId,
  empresaId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  empresaId: string | null;
  tipoObra: string;
  descricaoSolicitacao: string;
}): Promise<IntelligentBudgetContext> {
  const composicoesQuery = supabase
    .from("composicoes")
    .select(
      `
        id,
        codigo,
        nome,
        descricao,
        custo_total
      `
    )
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(25);

  const materiaisQuery = supabase
    .from("materiais")
    .select(
      `
        id,
        codigo,
        nome,
        descricao,
        preco
      `
    )
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(20);

  const servicosQuery = supabase
    .from("servicos")
    .select(
      `
        id,
        codigo,
        nome,
        descricao,
        preco
      `
    )
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(20);

  const equipamentosQuery = supabase
    .from("equipamentos")
    .select(
      `
        id,
        codigo,
        nome,
        descricao,
        preco
      `
    )
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(15);

  const [composicoesRes, materiaisRes, servicosRes, equipamentosRes] =
    await Promise.all([
      composicoesQuery,
      materiaisQuery,
      servicosQuery,
      equipamentosQuery,
    ]);

  if (composicoesRes.error) {
    throw new Error(`Erro ao buscar composições: ${composicoesRes.error.message}`);
  }

  if (materiaisRes.error) {
    throw new Error(`Erro ao buscar materiais: ${materiaisRes.error.message}`);
  }

  if (servicosRes.error) {
    throw new Error(`Erro ao buscar serviços: ${servicosRes.error.message}`);
  }

  if (equipamentosRes.error) {
    throw new Error(`Erro ao buscar equipamentos: ${equipamentosRes.error.message}`);
  }

  const composicoesDisponiveis = (composicoesRes.data ?? []).map((item) => ({
    id: item.id,
    codigo: item.codigo ?? null,
    nome: item.nome,
    descricao: item.descricao ?? null,
    unidadeMedidaNome: null,
    custoTotal: Number(item.custo_total ?? 0),
  }));

  const recursosDisponiveis = [
    ...(materiaisRes.data ?? []).map((item) => ({
      id: item.id,
      tipo: "material" as const,
      codigo: item.codigo ?? null,
      nome: item.nome,
      descricao: item.descricao ?? null,
      unidadeMedidaNome: null,
      preco: item.preco !== null && item.preco !== undefined ? Number(item.preco) : null,
    })),
    ...(servicosRes.data ?? []).map((item) => ({
      id: item.id,
      tipo: "servico" as const,
      codigo: item.codigo ?? null,
      nome: item.nome,
      descricao: item.descricao ?? null,
      unidadeMedidaNome: null,
      preco: item.preco !== null && item.preco !== undefined ? Number(item.preco) : null,
    })),
    ...(equipamentosRes.data ?? []).map((item) => ({
      id: item.id,
      tipo: "equipamento" as const,
      codigo: item.codigo ?? null,
      nome: item.nome,
      descricao: item.descricao ?? null,
      unidadeMedidaNome: null,
      preco: item.preco !== null && item.preco !== undefined ? Number(item.preco) : null,
    })),
  ];

  return intelligentBudgetContextSchema.parse({
    composicoesDisponiveis,
    recursosDisponiveis,
  });
}

function extractTextFromAnthropicResponse(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const content = (payload as { content?: AnthropicTextBlock[] }).content;
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => (block?.type === "text" ? block.text ?? "" : ""))
    .join("\n")
    .trim();
}

function addDaysAsIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildStageDescription(stage: {
  descricao?: string | null;
  percentual?: number | null;
  marcos?: string[];
}) {
  const parts: string[] = [];

  if (stage.descricao?.trim()) {
    parts.push(stage.descricao.trim());
  }

  if (stage.percentual !== null && stage.percentual !== undefined) {
    parts.push(`Percentual planejado: ${stage.percentual.toFixed(2).replace(".", ",")}%`);
  }

  if (stage.marcos?.length) {
    parts.push(`Marcos: ${stage.marcos.join(" • ")}`);
  }

  return parts.join("\n\n") || null;
}

function buildItemDescription(item: {
  descricao: string;
  unidadeSigla?: string | null;
  observacao?: string | null;
  composicaoSugeridaNome?: string | null;
  composicaoSugeridaCodigo?: string | null;
}) {
  const extras: string[] = [];

  if (item.unidadeSigla?.trim()) {
    extras.push(`Unidade: ${item.unidadeSigla.trim()}`);
  }

  if (item.composicaoSugeridaNome?.trim()) {
    extras.push(`Composição sugerida: ${item.composicaoSugeridaNome.trim()}`);
  }

  if (item.composicaoSugeridaCodigo?.trim()) {
    extras.push(`Código sugerido: ${item.composicaoSugeridaCodigo.trim()}`);
  }

  if (item.observacao?.trim()) {
    extras.push(`Observação: ${item.observacao.trim()}`);
  }

  return extras.length > 0
    ? `${item.descricao}\n\n${extras.join("\n")}`
    : item.descricao;
}

function mapTipoItemForDatabase(
  tipo: "material" | "servico" | "composicao" | "equipamento" | "outro"
) {
  return tipo;
}