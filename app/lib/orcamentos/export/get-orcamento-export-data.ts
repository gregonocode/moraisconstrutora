// app/lib/orcamentos/export/get-orcamento-export-data.ts
import { createClient } from "@/app/lib/supabase/server";

export type OrcamentoStatus =
  | "rascunho"
  | "enviado"
  | "aprovado"
  | "reprovado"
  | "cancelado"
  | "convertido";

export type ClienteRow = {
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}[];

export type OrcamentoRow = {
  id: string;
  user_id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  obra_id: string | null;
  codigo: string | null;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  valor_total: number | string;
  custo_total: number | string;
  margem_lucro: number | string | null;
  status: OrcamentoStatus;
  validade_em: string | null;
  aprovado_em: string | null;
  observacoes: string | null;
  modalidade_contratacao: string | null;
  prazo_estimado: string | null;
  escopo_resumido: string | null;
  inclui_materiais: boolean | null;
  inclui_mao_de_obra: boolean | null;
  inclui_equipamentos: boolean | null;
  texto_apresentacao: string | null;
  diferenciais: unknown;
  escopo_pdf: unknown;
  condicoes_comerciais: string | null;
  garantia_texto: string | null;
  proximos_passos: unknown;
  proposta_modelo: string | null;
  created_at: string;
  updated_at: string;
  cliente: ClienteRow | null;
};

export type OrcamentoItemRow = {
  id: string;
  orcamento_id: string;
  etapa_id: string | null;
  tipo_item: string;
  descricao: string;
  quantidade: number | string;
  custo_unitario: number | string;
  venda_unitaria: number | string;
  custo_total: number | string | null;
  venda_total: number | string | null;
  ordem: number;
  created_at: string;
};

export type OrcamentoEtapaRow = {
  id: string;
  orcamento_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  valor_total: number | string;
  created_at: string;
};

export type OrcamentoExportData = {
  userId: string;
  responsavelNome: string;
  orcamento: OrcamentoRow;
  cliente: ClienteRow[number] | null;
  itens: OrcamentoItemRow[];
  etapas: OrcamentoEtapaRow[];
  valorTotal: number;
};

export async function getOrcamentoExportData(orcamentoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data: usuarioRow, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id, nome")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (usuarioError) {
    throw new Error(`Erro ao buscar usuário interno: ${usuarioError.message}`);
  }

  if (!usuarioRow) {
    throw new Error("Usuário interno não encontrado.");
  }

  const userId = usuarioRow.id as string;

  const [
    { data: orcamentoData, error: orcamentoError },
    { data: itensData, error: itensError },
    { data: etapasData, error: etapasError },
  ] = await Promise.all([
    supabase
      .from("orcamentos")
      .select(
        `
          id,
          user_id,
          empresa_id,
          cliente_id,
          obra_id,
          codigo,
          titulo,
          subtitulo,
          descricao,
          valor_total,
          custo_total,
          margem_lucro,
          status,
          validade_em,
          aprovado_em,
          observacoes,
          modalidade_contratacao,
          prazo_estimado,
          escopo_resumido,
          inclui_materiais,
          inclui_mao_de_obra,
          inclui_equipamentos,
          texto_apresentacao,
          diferenciais,
          escopo_pdf,
          condicoes_comerciais,
          garantia_texto,
          proximos_passos,
          proposta_modelo,
          created_at,
          updated_at,
          cliente:clientes(
            nome,
            telefone,
            email,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep
          )
        `
      )
      .eq("id", orcamentoId)
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("orcamento_itens")
      .select(
        `
          id,
          orcamento_id,
          etapa_id,
          tipo_item,
          descricao,
          quantidade,
          custo_unitario,
          venda_unitaria,
          custo_total,
          venda_total,
          ordem,
          created_at
        `
      )
      .eq("orcamento_id", orcamentoId)
      .eq("user_id", userId)
      .order("ordem", { ascending: true }),

    supabase
      .from("orcamento_etapas")
      .select(
        `
          id,
          orcamento_id,
          nome,
          descricao,
          ordem,
          valor_total,
          created_at
        `
      )
      .eq("orcamento_id", orcamentoId)
      .eq("user_id", userId)
      .order("ordem", { ascending: true }),
  ]);

  if (orcamentoError) {
    throw new Error(`Erro ao carregar orçamento: ${orcamentoError.message}`);
  }

  if (itensError) {
    throw new Error(`Erro ao carregar itens: ${itensError.message}`);
  }

  if (etapasError) {
    throw new Error(`Erro ao carregar etapas: ${etapasError.message}`);
  }

  if (!orcamentoData) {
    throw new Error("Orçamento não encontrado.");
  }

  const orcamento = orcamentoData as OrcamentoRow;
  const itens = (itensData ?? []) as OrcamentoItemRow[];
  const etapas = (etapasData ?? []) as OrcamentoEtapaRow[];
  const cliente = orcamento.cliente?.[0] ?? null;
  const valorTotal = Number(orcamento.valor_total ?? 0);

  return {
    userId,
    responsavelNome: usuarioRow.nome ?? "Usuário",
    orcamento,
    cliente,
    itens,
    etapas,
    valorTotal,
  } satisfies OrcamentoExportData;
}