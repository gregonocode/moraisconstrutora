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
};

type MaterialRow = {
  id: string;
  nome: string;
};

type ServicoRow = {
  id: string;
  nome: string;
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
      .select("id, nome")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(10),
    supabase
      .from("materiais")
      .select("id, nome")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(10),
    supabase
      .from("servicos")
      .select("id, nome")
      .eq("user_id", userId)
      .order("nome", { ascending: true })
      .limit(10),
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
        valor_total: 0,
        custo_total: 0,
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

      <form action={createOrcamento} className="space-y-4">
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CardBlock
            title="Informações básicas"
            description="Preencha os dados principais para iniciar o orçamento."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  defaultValue={sugestaoCodigo}
                />
              </Field>

              <Field>
                <Label htmlFor="titulo">Título do orçamento</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  placeholder="Ex: Residência unifamiliar - etapa estrutural"
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="empresa_id">Empresa</Label>
                <Select id="empresa_id" name="empresa_id">
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label htmlFor="cliente_id">Cliente</Label>
                <Select id="cliente_id" name="cliente_id">
                  <option value="">Selecione um cliente</option>
                  {clientes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label htmlFor="validade_em">Validade</Label>
                <Input id="validade_em" name="validade_em" type="date" />
              </Field>

              <Field>
                <Label htmlFor="margem_lucro">Margem de lucro (%)</Label>
                <Input
                  id="margem_lucro"
                  name="margem_lucro"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 15.00"
                />
              </Field>

              <Field className="sm:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  placeholder="Descreva o escopo, premissas e objetivo do orçamento."
                />
              </Field>

              <Field className="sm:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  placeholder="Condições comerciais, observações técnicas e detalhes complementares."
                />
              </Field>
            </div>
          </CardBlock>

          <CardBlock
            title={modo === "ia" ? "Entrada inteligente" : "Base operacional"}
            description={
              modo === "ia"
                ? "Campos pensados para orientar a futura geração de orçamento por IA."
                : "Referências internas já disponíveis para montar o orçamento manual."
            }
          >
            {modo === "ia" ? (
              <div className="space-y-4">
                <MiniInfo
                  icon={<Brain className="h-4 w-4" />}
                  label="Objetivo"
                  value="Gerar uma estrutura inicial de orçamento a partir de um prompt técnico."
                />
                <MiniInfo
                  icon={<MessageSquareText className="h-4 w-4" />}
                  label="Prompt sugerido"
                  value="Descreva o tipo de obra, padrão construtivo, escopo e restrições do cliente."
                />
                <MiniInfo
                  icon={<CircleDollarSign className="h-4 w-4" />}
                  label="Próxima etapa"
                  value="Após gerar com IA, revisar itens, custos, venda e aprovação."
                />
                <div className="rounded-2xl border border-dashed border-[#FF5017]/20 bg-[#FF5017]/5 p-4 text-sm text-[#FFB39A]">
                  Nesta primeira versão, o card inteligente já deixa o fluxo
                  pronto visualmente. Depois você pode ligar isso a um endpoint
                  real de IA.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <MiniInfo
                  icon={<ClipboardList className="h-4 w-4" />}
                  label="Composições disponíveis"
                  value={`${composicoes.length} composição(ões) pronta(s) para apoiar o orçamento.`}
                />
                <MiniInfo
                  icon={<FileText className="h-4 w-4" />}
                  label="Materiais disponíveis"
                  value={`${materiais.length} material(is) carregado(s) para composição de custo.`}
                />
                <MiniInfo
                  icon={<Calculator className="h-4 w-4" />}
                  label="Serviços disponíveis"
                  value={`${servicos.length} serviço(s) vinculado(s) ao seu usuário.`}
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <MiniList
                    title="Composições recentes"
                    items={composicoes.map((item) => item.nome)}
                    emptyText="Nenhuma composição encontrada."
                  />
                  <MiniList
                    title="Serviços recentes"
                    items={servicos.map((item) => item.nome)}
                    emptyText="Nenhum serviço encontrado."
                  />
                </div>
              </div>
            )}
          </CardBlock>
        </section>

        <CardBlock
          title="Estrutura inicial dos itens"
          description="Bloco visual para orientar a próxima etapa do cadastro detalhado."
        >
          <div className="overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Ordem
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Tipo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Descrição
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Quantidade
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Custo unit.
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Venda unit.
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Total venda
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-white/45"
                    >
                      Nenhum item adicionado ainda. Na próxima etapa, aqui entra
                      o cadastro real de itens do orçamento.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardBlock>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <TopAction href="/dashboard/orcamentos" variant="ghost">
            Cancelar
          </TopAction>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            Salvar orçamento
          </button>
        </div>
      </form>
    </div>
  );
}

function buildBudgetCode(total: number) {
  const next = total + 1;
  return `ORC-${String(next).padStart(4, "0")}`;
}

function CardBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

      <div className="relative z-10">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="text-sm text-white/50">{description}</p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
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

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-white/70">
        {icon}
        <p className="text-xs uppercase tracking-[0.12em] text-white/35">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{value}</p>
    </div>
  );
}

function MiniList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-white/35">
        {title}
      </p>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-white/45">{emptyText}</p>
        ) : (
          items.slice(0, 5).map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-white/70"
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
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

  return <Link href={href} className={`${base} ${styles}`}>{children}</Link>;
}

function Field({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40"
    >
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition",
        "focus:border-[#FF5017]/30 focus:bg-white/[0.05]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition",
        "focus:border-[#FF5017]/30 focus:bg-white/[0.05]",
        props.className ?? "",
      ].join(" ")}
    >
      {props.children}
    </select>
  );
}

function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      rows={4}
      className={[
        "w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition",
        "focus:border-[#FF5017]/30 focus:bg-white/[0.05]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}