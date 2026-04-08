import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bot,
  CalendarDays,
  Eye,
  FileDown,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User2,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type SearchParams = {
  q?: string;
  status?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type OrcamentoStatus =
  | "rascunho"
  | "enviado"
  | "aprovado"
  | "reprovado"
  | "cancelado"
  | "convertido";

type OrcamentoRow = {
  id: string;
  codigo: string | null;
  titulo: string;
  descricao: string | null;
  valor_total: number | string;
  custo_total: number | string;
  margem_lucro: number | string | null;
  status: OrcamentoStatus;
  validade_em: string | null;
  aprovado_em: string | null;
  created_at: string;
  cliente: { nome: string }[] | null;
};

export default async function OrcamentosPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";

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

  let query = supabase
    .from("orcamentos")
    .select(
      `
        id,
        codigo,
        titulo,
        descricao,
        valor_total,
        custo_total,
        margem_lucro,
        status,
        validade_em,
        aprovado_em,
        created_at,
        cliente:clientes(nome)
      `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `codigo.ilike.%${q}%,titulo.ilike.%${q}%,descricao.ilike.%${q}%`
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data: orcamentosData, error: orcamentosError } = await query;

  if (orcamentosError) {
    throw new Error(`Erro ao carregar orçamentos: ${orcamentosError.message}`);
  }

  const orcamentos = (orcamentosData ?? []) as OrcamentoRow[];

  const totalOrcamentos = orcamentos.length;
  const totalAprovados = orcamentos.filter(
    (item) => item.status === "aprovado"
  ).length;

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Orçamentos
        </h1>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ActionCard
          href="/dashboard/orcamentos/novo?modo=ia"
          title="Novo Orçamento Inteligente"
          description="Gere um orçamento com apoio de IA a partir das informações principais da proposta."
          icon={<Sparkles className="h-5 w-5" />}
          badge="Em Desenvolvimento"
          accent="orange"
        />

        <ActionCard
          href="/dashboard/orcamentos/novo?modo=manual"
          title="Novo Orçamento Manual"
          description="Monte seu orçamento manualmente usando composições, serviços, materiais e etapas."
          icon={<FileText className="h-5 w-5" />}
          badge="Disponível"
          accent="neutral"
        />
      </section>

      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Lista de orçamentos
              </h2>
              <p className="text-sm text-white/50">
                Gerencie orçamentos, acompanhe status e acesse rapidamente as
                ações principais.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <MiniMetric
                label="Total"
                value={String(totalOrcamentos)}
                highlight={false}
              />
              <MiniMetric
                label="Aprovados"
                value={String(totalAprovados)}
                highlight
              />
            </div>
          </div>

          <form
            method="get"
            className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.8fr_auto]"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input
                name="q"
                defaultValue={q}
                type="text"
                placeholder="Buscar por código, título ou descrição"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#252525]">
                Todos os status
              </option>
              <option value="rascunho" className="bg-[#252525]">
                Rascunho
              </option>
              <option value="enviado" className="bg-[#252525]">
                Enviado
              </option>
              <option value="aprovado" className="bg-[#252525]">
                Aprovado
              </option>
              <option value="reprovado" className="bg-[#252525]">
                Reprovado
              </option>
              <option value="cancelado" className="bg-[#252525]">
                Cancelado
              </option>
              <option value="convertido" className="bg-[#252525]">
                Convertido
              </option>
            </select>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
              >
                <Filter className="h-4 w-4" />
                Filtrar
              </button>

              <Link
                href="/dashboard/orcamentos"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
              >
                Limpar
              </Link>
            </div>
          </form>

          <div className="mt-5 overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Descrição
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Data
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Cliente
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Responsável
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Valor
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orcamentos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-white/45"
                      >
                        Nenhum orçamento encontrado.
                      </td>
                    </tr>
                  ) : (
                    orcamentos.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04] text-[#FF8A63]">
                              <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {(item.codigo ?? "Sem código") + " · " + item.titulo}
                              </p>
                              <p className="truncate text-xs text-white/45">
                                {item.descricao?.trim() || "Sem descrição"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          <div className="inline-flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-white/35" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.cliente?.[0]?.nome ?? "-"}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          <div className="inline-flex items-center gap-2">
                            <User2 className="h-4 w-4 text-white/35" />
                            {usuarioRow.nome ?? "Usuário"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-white">
                          {formatCurrency(Number(item.valor_total ?? 0))}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <IconLink
                              href={`/dashboard/orcamentos/${item.id}`}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </IconLink>

                            <IconLink
                              href={`/dashboard/orcamentos/${item.id}`}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </IconLink>

                            <button
                              type="button"
                              title="Gerar PDF"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                              <FileDown className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              title="Excluir"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>Mostrando {orcamentos.length} orçamento(s)</p>

            <Link
              href="/dashboard/orcamentos/novo?modo=manual"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
            >
              <Plus className="h-4 w-4" />
              Novo orçamento
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function ActionCard({
  href,
  title,
  description,
  icon,
  badge,
  accent,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  badge: string;
  accent: "orange" | "neutral";
}) {
  const isOrange = accent === "orange";

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-white/10 sm:rounded-[28px] sm:p-6"
    >
      <div
        className={`absolute inset-0 ${
          isOrange
            ? "bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.14),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]"
            : "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]"
        }`}
      />

      <div className="relative z-10 flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
            isOrange
              ? "border-[#FF5017]/20 bg-[#FF5017]/12 text-[#FF8A63]"
              : "border-white/5 bg-white/[0.05] text-white/75"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                isOrange
                  ? "border border-[#FF5017]/20 bg-[#FF5017]/10 text-[#FF8A63]"
                  : "border border-white/10 bg-white/[0.04] text-white/55"
              }`}
            >
              {badge}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function MiniMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          highlight ? "text-[#FF8A63]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: OrcamentoStatus }) {
  const styles: Record<
    OrcamentoStatus,
    { label: string; className: string; dot: string }
  > = {
    rascunho: {
      label: "Rascunho",
      className: "border border-white/10 bg-white/[0.05] text-white/60",
      dot: "bg-white/35",
    },
    enviado: {
      label: "Enviado",
      className:
        "border border-sky-500/20 bg-sky-500/10 text-sky-300",
      dot: "bg-sky-400",
    },
    aprovado: {
      label: "Aprovado",
      className:
        "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400",
    },
    reprovado: {
      label: "Reprovado",
      className: "border border-rose-500/20 bg-rose-500/10 text-rose-300",
      dot: "bg-rose-400",
    },
    cancelado: {
      label: "Cancelado",
      className: "border border-white/10 bg-white/[0.05] text-white/55",
      dot: "bg-white/35",
    },
    convertido: {
      label: "Convertido",
      className:
        "border border-[#FF5017]/20 bg-[#FF5017]/10 text-[#FF8A63]",
      dot: "bg-[#FF8A63]",
    },
  };

  const item = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${item.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}

function IconLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </Link>
  );
}