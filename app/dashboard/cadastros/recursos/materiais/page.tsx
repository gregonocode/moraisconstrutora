//app\dashboard\cadastros\recursos\materiais\page.tsx
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
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type SearchParams = {
  q?: string;
  grupo?: string;
  subgrupo?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type GrupoRow = {
  id: string;
  nome: string;
};

type SubgrupoRow = {
  id: string;
  nome: string;
  grupo_id: string;
};

type MaterialRow = {
  id: string;
  nome: string;
  preco: number | null;
  grupo: { nome: string }[] | null;
  subgrupo: { nome: string }[] | null;
  unidade: { sigla: string }[] | null;
};

export default async function MateriaisPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  const q = params.q?.trim() ?? "";
  const grupo = params.grupo?.trim() ?? "";
  const subgrupo = params.subgrupo?.trim() ?? "";

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

  const [
    materiaisRes,
    gruposRes,
    subgruposRes,
    totalMateriaisRes,
    totalGruposRes,
    totalSubgruposRes,
    totalComPrecoRes,
  ] = await Promise.all([
    getMateriais({
      supabase,
      userId,
      q,
      grupo,
      subgrupo,
    }),
    supabase
      .from("grupos_recurso")
      .select("id, nome")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("subgrupos_recurso")
      .select("id, nome, grupo_id")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("materiais")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("grupos_recurso")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("subgrupos_recurso")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("materiais")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("preco", 0),
  ]);

  if (materiaisRes.error) {
    throw new Error(`Erro ao carregar materiais: ${materiaisRes.error.message}`);
  }

  if (gruposRes.error) {
    throw new Error(`Erro ao carregar grupos: ${gruposRes.error.message}`);
  }

  if (subgruposRes.error) {
    throw new Error(
      `Erro ao carregar subgrupos: ${subgruposRes.error.message}`
    );
  }

  const materiais = (materiaisRes.data ?? []) as MaterialRow[];
  const grupos = (gruposRes.data ?? []) as GrupoRow[];
  const subgruposList = (subgruposRes.data ?? []) as SubgrupoRow[];

  const subgruposFiltrados = grupo
    ? subgruposList.filter((item) => item.grupo_id === grupo)
    : subgruposList;

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
              Materiais
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Gerencie os materiais da sua operação com filtros, preço,
              unidade de medida e organização por grupo e subgrupo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:min-w-[360px]">
            <MiniStat
              label="Total cadastrados"
              value={String(totalMateriaisRes.count ?? 0)}
            />
            <MiniStat label="Grupos" value={String(totalGruposRes.count ?? 0)} />
            <MiniStat
              label="Subgrupos"
              value={String(totalSubgruposRes.count ?? 0)}
            />
            <MiniStat
              label="Com preço"
              value={String(totalComPrecoRes.count ?? 0)}
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
                Lista de materiais
              </h2>
              <p className="text-sm text-white/50">
                Busque, filtre e gerencie os itens cadastrados.
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
                href="/dashboard/cadastros/recursos/materiais/novo"
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
                placeholder="Buscar por nome"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>

            <select
              name="grupo"
              defaultValue={grupo}
              className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#252525]">
                Selecione um grupo
              </option>
              {grupos.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#252525]">
                  {item.nome}
                </option>
              ))}
            </select>

            <select
              name="subgrupo"
              defaultValue={subgrupo}
              className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="" className="bg-[#252525]">
                Selecione um subgrupo
              </option>
              {subgruposFiltrados.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#252525]">
                  {item.nome}
                </option>
              ))}
            </select>

            <div className="xl:col-span-3 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
              >
                Filtrar
              </button>

              <Link
                href="/dashboard/cadastros/recursos/materiais"
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
                      Nome
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Unidade
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Grupo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Subgrupo
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Preço
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {materiais.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm text-white/45"
                      >
                        Nenhum material encontrado.
                      </td>
                    </tr>
                  ) : (
                    materiais.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-white">
                          {item.nome}
                        </td>
                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.unidade?.[0]?.sigla ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.grupo?.[0]?.nome ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-white/65">
                          {item.subgrupo?.[0]?.nome ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-[#FF8A63]">
                          {formatCurrency(item.preco)}
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
            <p>Mostrando {materiais.length} materiais</p>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white/60">
              Paginação vem depois
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

async function getMateriais({
  supabase,
  userId,
  q,
  grupo,
  subgrupo,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  q: string;
  grupo: string;
  subgrupo: string;
}) {
  let query = supabase
    .from("materiais")
    .select(
      `
      id,
      nome,
      preco,
      grupo_id,
      subgrupo_id,
      unidade_medida_id,
      grupo:grupos_recurso(nome),
      subgrupo:subgrupos_recurso(nome),
      unidade:unidades_medida(sigla)
    `
    )
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (q) {
    query = query.ilike("nome", `%${q}%`);
  }

  if (grupo) {
    query = query.eq("grupo_id", grupo);
  }

  if (subgrupo) {
    query = query.eq("subgrupo_id", subgrupo);
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