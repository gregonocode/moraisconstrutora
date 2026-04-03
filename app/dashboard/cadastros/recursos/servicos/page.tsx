import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Download,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type SearchParams = {
  q?: string;
  grupo?: string;
  status?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type GrupoRow = {
  id: string;
  nome: string;
};

type ServicoRow = {
  id: string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  custo_unitario: number | null;
  preco: number | null;
  ativo: boolean;
  grupo: { nome: string }[] | null;
  subgrupo: { nome: string }[] | null;
  unidade: { sigla: string }[] | null;
  fornecedor: { nome: string }[] | null;
};

export default async function ServicosPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  const q = params.q?.trim() ?? "";
  const grupo = params.grupo?.trim() ?? "";
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

  const [servicosRes, gruposRes, totalRes, ativosRes, inativosRes] =
    await Promise.all([
      getServicos({
        supabase,
        userId,
        q,
        grupo,
        status,
      }),
      supabase
        .from("grupos_recurso")
        .select("id, nome")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("nome", { ascending: true }),
      supabase
        .from("servicos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("servicos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("ativo", true),
      supabase
        .from("servicos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("ativo", false),
    ]);

  if (servicosRes.error) {
    throw new Error(`Erro ao carregar serviços: ${servicosRes.error.message}`);
  }

  if (gruposRes.error) {
    throw new Error(`Erro ao carregar grupos: ${gruposRes.error.message}`);
  }

  const servicos = (servicosRes.data ?? []) as ServicoRow[];
  const grupos = (gruposRes.data ?? []) as GrupoRow[];

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
                Cadastros &gt; Recursos
              </p>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Serviços
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Gerencie os serviços da operação com grupo, unidade, fornecedor,
              custo unitário, preço e status.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:min-w-[360px]">
            <MiniStat label="Total cadastrados" value={String(totalRes.count ?? 0)} />
            <MiniStat label="Ativos" value={String(ativosRes.count ?? 0)} />
            <MiniStat label="Inativos" value={String(inativosRes.count ?? 0)} />
            <MiniStat
              label="Na listagem"
              value={String(servicos.length)}
              highlight
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Lista de serviços
              </h2>
              <p className="text-sm text-white/50">
                Busque, filtre e gerencie os serviços cadastrados.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>

              <Link
                href="/dashboard/cadastros/recursos/servicos/novo"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </Link>
            </div>
          </div>

          <form
            method="get"
            className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr]"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
              <Search className="h-4 w-4 text-white/35" />
              <input
                name="q"
                defaultValue={q}
                type="text"
                placeholder="Buscar por nome, código ou descrição"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>

            <select
              name="grupo"
              defaultValue={grupo}
              className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#252525]">
                Todos os grupos
              </option>
              {grupos.map((item) => (
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
                href="/dashboard/cadastros/recursos/servicos"
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
                      Serviço
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Grupo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Unidade
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Fornecedor
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Custo unitário
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Preço
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
                  {servicos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-white/45"
                      >
                        Nenhum serviço encontrado.
                      </td>
                    </tr>
                  ) : (
                    servicos.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.04] text-[#FF8A63]">
                              <Wrench className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {item.nome}
                              </p>
                              <p className="truncate text-xs text-white/45">
                                Código: {item.codigo || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          <div className="space-y-1">
                            <p>{item.grupo?.[0]?.nome ?? "-"}</p>
                            <p className="text-xs text-white/45">
                              {item.subgrupo?.[0]?.nome ?? "-"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.unidade?.[0]?.sigla ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.fornecedor?.[0]?.nome ?? "-"}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-[#FF8A63]">
                          {formatCurrency(item.custo_unitario)}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-white/75">
                          {formatCurrency(item.preco)}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge ativo={item.ativo} />
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
            <p>Mostrando {servicos.length} serviços</p>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/60">
              Paginação vem depois
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

async function getServicos({
  supabase,
  userId,
  q,
  grupo,
  status,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  q: string;
  grupo: string;
  status: string;
}) {
  let query = supabase
    .from("servicos")
    .select(
      `
      id,
      codigo,
      nome,
      descricao,
      custo_unitario,
      preco,
      ativo,
      grupo_id,
      subgrupo_id,
      unidade_medida_id,
      fornecedor_id,
      grupo:grupos_recurso(nome),
      subgrupo:subgrupos_recurso(nome),
      unidade:unidades_medida(sigla),
      fornecedor:fornecedores(nome)
    `
    )
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (q) {
    query = query.or(
      `nome.ilike.%${q}%,codigo.ilike.%${q}%,descricao.ilike.%${q}%`
    );
  }

  if (grupo) {
    query = query.eq("grupo_id", grupo);
  }

  if (status === "ativo") {
    query = query.eq("ativo", true);
  }

  if (status === "inativo") {
    query = query.eq("ativo", false);
  }

  return query;
}

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function MiniStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 ${
        highlight
          ? "border-[#FF5017]/30 bg-[#FF5017]/10"
          : "border-white/5 bg-white/[0.04]"
      }`}
    >
      <p className="text-[11px] font-medium text-white/50 sm:text-xs">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-bold sm:text-xl ${
          highlight ? "text-[#FF8A63]" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        ativo
          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border border-white/10 bg-white/[0.05] text-white/55"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ativo ? "bg-emerald-400" : "bg-white/35"
        }`}
      />
      {ativo ? "Ativo" : "Inativo"}
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