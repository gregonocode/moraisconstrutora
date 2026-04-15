import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Brain,
  Calculator,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Layers3,
  MessageSquareText,
  Sparkles,
  User2,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import OrcamentoFormClient from "./OrcamentoFormClient";

type SearchParams = {
  modo?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type ClienteRow = {
  id: string;
  nome: string;
};

type EmpresaRow = {
  id: string;
  nome: string;
};

type ComposicaoRow = {
  id: string;
  nome: string;
  custo_total?: number | null;
};

type MaterialRow = {
  id: string;
  nome: string;
  preco?: number | null;
};

type ServicoRow = {
  id: string;
  nome: string;
  custo_unitario?: number | null;
};

export default async function NovoOrcamentoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const modo = params.modo === "ia" ? "ia" : "manual";

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
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
    redirect("/login");
  }

  const userId = usuarioRow.id as string;

  const [
    clientesRes,
    empresasRes,
    composicoesRes,
    materiaisRes,
    servicosRes,
    totalOrcamentosRes,
  ] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(100),
    supabase
      .from("empresas")
      .select("id, nome")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(50),
    supabase
      .from("composicoes")
      .select("id, nome, custo_total")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(200),
    supabase
      .from("materiais")
      .select("id, nome, preco")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(200),
    supabase
      .from("servicos")
      .select("id, nome, custo_unitario")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(200),
    supabase
      .from("orcamentos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  if (clientesRes.error) {
    throw new Error(`Erro ao carregar clientes: ${clientesRes.error.message}`);
  }

  if (empresasRes.error) {
    throw new Error(`Erro ao carregar empresas: ${empresasRes.error.message}`);
  }

  if (composicoesRes.error) {
    throw new Error(
      `Erro ao carregar composições: ${composicoesRes.error.message}`
    );
  }

  if (materiaisRes.error) {
    throw new Error(`Erro ao carregar materiais: ${materiaisRes.error.message}`);
  }

  if (servicosRes.error) {
    throw new Error(`Erro ao carregar serviços: ${servicosRes.error.message}`);
  }

  const clientes = (clientesRes.data ?? []) as ClienteRow[];
  const empresas = (empresasRes.data ?? []) as EmpresaRow[];
  const composicoes = (composicoesRes.data ?? []) as ComposicaoRow[];
  const materiais = (materiaisRes.data ?? []) as MaterialRow[];
  const servicos = (servicosRes.data ?? []) as ServicoRow[];

  const sugestaoCodigo = buildBudgetCode(totalOrcamentosRes.count ?? 0);

  async function createOrcamento(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/login");
    }

    const { data: usuarioRow, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (usuarioError) {
      throw new Error(`Erro ao buscar usuário interno: ${usuarioError.message}`);
    }

    if (!usuarioRow) {
      redirect("/login");
    }

    const userId = usuarioRow.id as string;

    const codigo = String(formData.get("codigo") ?? "").trim() || null;
    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim() || null;
    const observacoes =
      String(formData.get("observacoes") ?? "").trim() || null;

    const empresaIdRaw = String(formData.get("empresa_id") ?? "").trim();
    const clienteIdRaw = String(formData.get("cliente_id") ?? "").trim();
    const validadeEmRaw = String(formData.get("validade_em") ?? "").trim();
    const margemLucroRaw = String(formData.get("margem_lucro") ?? "").trim();

    if (!titulo) {
      throw new Error("O título do orçamento é obrigatório.");
    }

    const empresa_id = empresaIdRaw || null;
    const cliente_id = clienteIdRaw || null;
    const validade_em = validadeEmRaw || null;
    const margem_lucro = margemLucroRaw
      ? Number(margemLucroRaw.replace(",", "."))
      : null;

    if (margem_lucro !== null && Number.isNaN(margem_lucro)) {
      throw new Error("Margem de lucro inválida.");
    }

    const tipos = formData.getAll("item_tipo").map((v) => String(v));
    const composicaoIds = formData
      .getAll("item_composicao_id")
      .map((v) => String(v));
    const materialIds = formData.getAll("item_material_id").map((v) => String(v));
    const servicoIds = formData.getAll("item_servico_id").map((v) => String(v));
    const descricoes = formData.getAll("item_descricao").map((v) => String(v));
    const quantidades = formData.getAll("item_quantidade").map((v) => String(v));
    const custosUnitarios = formData
      .getAll("item_custo_unitario")
      .map((v) => String(v));
    const vendasUnitarias = formData
      .getAll("item_venda_unitaria")
      .map((v) => String(v));

    const itens: Array<{
      user_id: string;
      orcamento_id: string;
      ordem: number;
      tipo_item: string;
      composicao_id: string | null;
      material_id: string | null;
      servico_id: string | null;
      descricao: string | null;
      quantidade: number;
      custo_unitario: number;
      venda_unitaria: number;
      custo_total: number;
      total: number;
    }> = [];

    for (let i = 0; i < tipos.length; i++) {
      const tipoItem = (tipos[i] ?? "").trim();
      const quantidade = toNumber(quantidades[i]);
      const custoUnitario = toNumber(custosUnitarios[i]);
      const vendaUnitaria = toNumber(vendasUnitarias[i]);

      const composicaoId = emptyToNull(composicaoIds[i]);
      const materialId = emptyToNull(materialIds[i]);
      const servicoId = emptyToNull(servicoIds[i]);
      const descricaoItem = emptyToNull(descricoes[i]);

      const hasValidTarget =
        (tipoItem === "composicao" && composicaoId) ||
        (tipoItem === "material" && materialId) ||
        (tipoItem === "servico" && servicoId);

      if (!tipoItem || !hasValidTarget || quantidade <= 0) {
        continue;
      }

      itens.push({
        user_id: userId,
        orcamento_id: "",
        ordem: itens.length + 1,
        tipo_item: tipoItem,
        composicao_id: tipoItem === "composicao" ? composicaoId : null,
        material_id: tipoItem === "material" ? materialId : null,
        servico_id: tipoItem === "servico" ? servicoId : null,
        descricao: descricaoItem,
        quantidade,
        custo_unitario: custoUnitario,
        venda_unitaria: vendaUnitaria,
        custo_total: quantidade * custoUnitario,
        total: quantidade * vendaUnitaria,
      });
    }

    const custo_total = itens.reduce((acc, item) => acc + item.custo_total, 0);
    const valor_total = itens.reduce((acc, item) => acc + item.total, 0);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("orcamentos")
      .insert({
        user_id: userId,
        empresa_id,
        cliente_id,
        codigo,
        titulo,
        descricao,
        valor_total,
        custo_total,
        margem_lucro,
        status: "rascunho",
        validade_em,
        observacoes,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Erro ao salvar orçamento: ${error.message}`);
    }

    if (itens.length > 0) {
      const orcamentoId = data.id as string;

      const itensFinal = itens.map((item) => ({
        ...item,
        orcamento_id: orcamentoId,
      }));

      const { error: itensError } = await supabase
        .from("orcamento_itens")
        .insert(itensFinal);

      if (itensError) {
        throw new Error(`Erro ao salvar itens do orçamento: ${itensError.message}`);
      }
    }

    redirect(`/dashboard/orcamentos/${data.id}`);
  }

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.12),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <Link
                href="/dashboard/orcamentos"
                className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para orçamentos
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                    modo === "ia"
                      ? "border border-[#FF5017]/20 bg-[#FF5017]/10 text-[#FF8A63]"
                      : "border border-white/10 bg-white/[0.05] text-white/60"
                  }`}
                >
                  {modo === "ia" ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  {modo === "ia" ? "Modo inteligente" : "Modo manual"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/60">
                  {sugestaoCodigo}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {modo === "ia"
                  ? "Novo orçamento inteligente"
                  : "Novo orçamento manual"}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                {modo === "ia"
                  ? "Estruture a proposta com apoio de IA e depois refine os itens, custos e venda no seu fluxo operacional."
                  : "Monte o orçamento manualmente com base em cliente, empresa, composições, materiais e serviços já cadastrados."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <TopAction href="/dashboard/orcamentos" variant="ghost">
                Cancelar
              </TopAction>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Clientes"
          value={String(clientes.length)}
          icon={<User2 className="h-5 w-5" />}
          highlight
        />
        <SummaryCard
          title="Empresas"
          value={String(empresas.length)}
          icon={<Layers3 className="h-5 w-5" />}
        />
        <SummaryCard
          title="Composições"
          value={String(composicoes.length)}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <SummaryCard
          title="Serviços"
          value={String(servicos.length)}
          icon={<Calculator className="h-5 w-5" />}
        />
      </section>

      <OrcamentoFormClient
        action={createOrcamento}
        modo={modo}
        sugestaoCodigo={sugestaoCodigo}
        clientes={clientes}
        empresas={empresas}
        composicoes={composicoes}
        materiais={materiais}
        servicos={servicos}
      />
    </div>
  );
}

function buildBudgetCode(total: number) {
  const next = total + 1;
  return `ORC-${String(next).padStart(4, "0")}`;
}

function TopAction({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  variant?: "ghost" | "primary";
}) {
  const styles =
    variant === "primary"
      ? "bg-[#FF5017] text-white hover:brightness-110"
      : "border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]";

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  highlight = false,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              highlight ? "text-[#FF8A63]" : "text-white"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            highlight
              ? "bg-[#FF5017]/15 text-[#FF8A63]"
              : "bg-white/[0.04] text-white/70"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function emptyToNull(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toNumber(value: string | null | undefined) {
  const text = String(value ?? "").trim().replace(",", ".");
  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
}