import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Briefcase,
  Building2,
  FileText,
  MoreVertical,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type SearchParams = {
  q?: string;
  cargo?: string;
  status?: string;
};

type EquipePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
};

type CargoRow = {
  id: string;
  nome: string;
};

type ColaboradorRow = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  status: string | null;
  ativo: boolean | null;
  data_admissao: string | null;
  empresa: { nome: string }[] | null;
  cargo_rel: { nome: string }[] | null;
};

export default async function EquipePage({
  params,
  searchParams,
}: EquipePageProps) {
  const { id } = await params;
  const filters = (await searchParams) ?? {};

  const q = filters.q?.trim() ?? "";
  const cargo = filters.cargo?.trim() ?? "";
  const status = filters.status?.trim() ?? "";

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?next=/dashboard/obras/${id}/equipe`);
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

  const [
    colaboradoresRes,
    cargosRes,
    totalColaboradoresRes,
    ativosRes,
    inativosRes,
    empresasRes,
  ] = await Promise.all([
    getColaboradores({
      supabase,
      userId,
      q,
      cargo,
      status,
    }),
    supabase
      .from("cargos")
      .select("id, nome")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("colaboradores")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("colaboradores")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("ativo", true),
    supabase
      .from("colaboradores")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("ativo", false),
    supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("ativo", true),
  ]);

  if (colaboradoresRes.error) {
    throw new Error(
      `Erro ao carregar equipe da obra: ${colaboradoresRes.error.message}`
    );
  }

  if (cargosRes.error) {
    throw new Error(`Erro ao carregar cargos: ${cargosRes.error.message}`);
  }

  const colaboradores = (colaboradoresRes.data ?? []) as ColaboradorRow[];
  const cargos = (cargosRes.data ?? []) as CargoRow[];

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-2xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF5017]/25 bg-[#FF5017]/10 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF5017]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#FF8A63] sm:text-xs">
                Dashboard operacional
              </p>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Equipe da obra
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Visualize a equipe vinculada à obra, acompanhe indicadores do
              módulo e acesse rotas relacionadas ao cadastro base.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/dashboard/obras/${id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
            >
              Visão geral da obra
            </Link>

            <Link
              href="/dashboard/cadastros/recursos/mao-de-obra/novo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
            >
              <UserPlus className="h-4 w-4" />
              Novo colaborador
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
          ID da obra: <span className="font-semibold text-white">{id}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickStat
          title="Total de colaboradores"
          value={String(totalColaboradoresRes.count ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <QuickStat
          title="Ativos"
          value={String(ativosRes.count ?? 0)}
          icon={<ShieldCheck className="h-5 w-5" />}
          highlight
        />
        <QuickStat
          title="Inativos"
          value={String(inativosRes.count ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <QuickStat
          title="Empresas ativas"
          value={String(empresasRes.count ?? 0)}
          icon={<Building2 className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white">Ações rápidas</h2>
            <p className="text-sm text-white/50">
              Atalhos para os fluxos mais usados do módulo.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <QuickLink
                href={`/dashboard/obras/${id}/planejamento`}
                title="Planejamento"
                description="Acesse o planejamento desta obra."
                icon={<Briefcase className="h-4 w-4" />}
              />
              <QuickLink
                href={`/dashboard/obras/${id}/rdo`}
                title="Diário de obra / RDO"
                description="Registre o andamento diário da obra."
                icon={<FileText className="h-4 w-4" />}
              />
              <QuickLink
                href="/dashboard/cadastros/recursos/mao-de-obra/novo"
                title="Nova admissão"
                description="Adicione um novo colaborador ao sistema."
                icon={<UserPlus className="h-4 w-4" />}
              />
              <QuickLink
                href="/dashboard/cadastros/recursos/mao-de-obra"
                title="Cadastro base"
                description="Gerencie o cadastro geral de mão de obra."
                icon={<Users className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-white">Resumo do módulo</h2>
            <p className="text-sm text-white/50">
              Esta tela centraliza a visão operacional da equipe por obra.
            </p>

            <div className="mt-5 space-y-3">
              <MiniInfo label="Obra atual" value={id} />
              <MiniInfo
                label="Cadastro base"
                value="Colaboradores e cargos"
              />
              <MiniInfo
                label="Próxima evolução"
                value="Alocação por obra e frentes de trabalho"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Colaboradores da equipe
              </h2>
              <p className="text-sm text-white/50">
                Filtro rápido para acompanhamento operacional da obra.
              </p>
            </div>

            <Link
              href="/dashboard/cadastros/recursos/mao-de-obra"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
            >
              Ver cadastro completo
            </Link>
          </div>

          <form
            method="get"
            className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr]"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input
                name="q"
                defaultValue={q}
                type="text"
                placeholder="Buscar por nome, CPF, telefone ou e-mail"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>

            <select
              name="cargo"
              defaultValue={cargo}
              className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#252525]">
                Todos os cargos
              </option>
              {cargos.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#252525]">
                  {item.nome}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#252525]">
                Todos os status
              </option>
              <option value="ativo" className="bg-[#252525]">
                Ativos
              </option>
              <option value="inativo" className="bg-[#252525]">
                Inativos
              </option>
            </select>

            <div className="xl:col-span-3 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
              >
                Filtrar
              </button>

              <Link
                href={`/dashboard/obras/${id}/equipe`}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
              >
                Limpar filtros
              </Link>
            </div>
          </form>

          <div className="mt-5 overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Colaborador
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Cargo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Empresa
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Contato
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Admissão
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Status
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {colaboradores.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-white/45"
                      >
                        Nenhum colaborador encontrado.
                      </td>
                    </tr>
                  ) : (
                    colaboradores.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04] text-[#FF8A63]">
                              <Users className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {item.nome}
                              </p>
                              <p className="truncate text-xs text-white/45">
                                {item.cpf || "Sem CPF"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.cargo_rel?.[0]?.nome ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.empresa?.[0]?.nome ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          <div className="space-y-1">
                            <p>{item.telefone ?? "-"}</p>
                            <p className="text-xs text-white/45">
                              {item.email ?? "-"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          {formatDate(item.data_admissao)}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            ativo={item.ativo}
                            status={item.status}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <ActionIcon>
                              <Pencil className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon>
                              <Trash2 className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon>
                              <MoreVertical className="h-4 w-4" />
                            </ActionIcon>
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
            <p>Mostrando {colaboradores.length} colaboradores</p>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/60">
              Módulo vinculado à obra {id}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

async function getColaboradores({
  supabase,
  userId,
  q,
  cargo,
  status,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  q: string;
  cargo: string;
  status: string;
}) {
  let query = supabase
    .from("colaboradores")
    .select(
      `
      id,
      nome,
      cpf,
      telefone,
      email,
      status,
      ativo,
      data_admissao,
      cargo_id,
      empresa_id,
      cargo_rel:cargos(nome),
      empresa:empresas(nome)
    `
    )
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (q) {
    query = query.or(
      `nome.ilike.%${q}%,cpf.ilike.%${q}%,telefone.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  if (cargo) {
    query = query.eq("cargo_id", cargo);
  }

  if (status === "ativo") {
    query = query.eq("ativo", true);
  }

  if (status === "inativo") {
    query = query.eq("ativo", false);
  }

  return query;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function QuickStat({
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

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/5 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF5017]/10 text-[#FF8A63]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/45">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/75">{value}</p>
    </div>
  );
}

function StatusBadge({
  ativo,
  status,
}: {
  ativo: boolean | null;
  status: string | null;
}) {
  const isAtivo = ativo !== false;
  const label = status ?? (isAtivo ? "ativo" : "inativo");

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium capitalize ${
        isAtivo
          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border border-white/10 bg-white/[0.05] text-white/55"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isAtivo ? "bg-emerald-400" : "bg-white/35"
        }`}
      />
      {label}
    </span>
  );
}

function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </button>
  );
}
