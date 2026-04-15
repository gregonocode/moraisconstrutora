import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, Save } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import MaterialFormClient from "./MaterialFormClient";

type GrupoRow = {
  id: string;
  nome: string;
};

type SubgrupoRow = {
  id: string;
  nome: string;
  grupo_id: string;
};

type UnidadeMedidaRow = {
  id: string;
  nome: string;
  sigla: string | null;
};

type FornecedorRow = {
  id: string;
  nome: string;
};

export default async function NovoMaterialPage() {
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
    .single();

  if (usuarioError || !usuarioRow) {
    throw new Error("Usuário interno não encontrado na tabela usuarios.");
  }

  const userId = usuarioRow.id as string;

  const [
    { data: gruposData, error: gruposError },
    { data: subgruposData, error: subgruposError },
    { data: unidadesData, error: unidadesError },
    { data: fornecedoresData, error: fornecedoresError },
  ] = await Promise.all([
    supabase
      .from("grupos_recurso")
      .select("id, nome")
      .eq("user_id", userId)
      .eq("ativo", true)
      .eq("tipo", "material")
      .order("nome", { ascending: true }),

    supabase
      .from("subgrupos_recurso")
      .select("id, nome, grupo_id")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),

    supabase
      .from("unidades_medida")
      .select("id, nome, sigla")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),

    supabase
      .from("fornecedores")
      .select("id, nome")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
  ]);

  if (gruposError) {
    throw new Error(`Erro ao carregar grupos: ${gruposError.message}`);
  }

  if (subgruposError) {
    throw new Error(`Erro ao carregar subgrupos: ${subgruposError.message}`);
  }

  if (unidadesError) {
    throw new Error(
      `Erro ao carregar unidades de medida: ${unidadesError.message}`
    );
  }

  if (fornecedoresError) {
    throw new Error(`Erro ao carregar fornecedores: ${fornecedoresError.message}`);
  }

  const grupos = (gruposData ?? []) as GrupoRow[];
  const subgrupos = (subgruposData ?? []) as SubgrupoRow[];
  const unidadesMedida = (unidadesData ?? []) as UnidadeMedidaRow[];
  const fornecedores = (fornecedoresData ?? []) as FornecedorRow[];

  async function createMaterial(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const nome = String(formData.get("nome") || "").trim();
    const codigo = String(formData.get("codigo") || "").trim();
    const descricao = String(formData.get("descricao") || "").trim();
    const grupo_id = String(formData.get("grupo_id") || "").trim();
    const subgrupo_id = String(formData.get("subgrupo_id") || "").trim();
    const unidade_medida_id = String(formData.get("unidade_medida_id") || "").trim();
    const fornecedor_id = String(formData.get("fornecedor_id") || "").trim();
    const precoRaw = String(formData.get("preco") || "").trim();
    const estoqueMinimoRaw = String(formData.get("estoque_minimo") || "").trim();
    const ativo = formData.get("ativo") === "on";

    if (!nome) {
      throw new Error("O nome do material é obrigatório.");
    }

    const precoNormalizado = precoRaw
      .replace(/\s/g, "")
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".");

    const estoqueMinimoNormalizado = estoqueMinimoRaw
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const preco = precoNormalizado ? Number(precoNormalizado) : 0;
    const estoque_minimo = estoqueMinimoNormalizado
      ? Number(estoqueMinimoNormalizado)
      : 0;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data: usuarioRow, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (usuarioError || !usuarioRow) {
      throw new Error("Usuário interno não encontrado na tabela usuarios.");
    }

    const { error } = await supabase.from("materiais").insert({
      user_id: usuarioRow.id,
      nome,
      codigo: codigo || null,
      descricao: descricao || null,
      grupo_id: grupo_id || null,
      subgrupo_id: subgrupo_id || null,
      unidade_medida_id: unidade_medida_id || null,
      fornecedor_id: fornecedor_id || null,
      preco: Number.isNaN(preco) ? 0 : preco,
      estoque_minimo: Number.isNaN(estoque_minimo) ? 0 : estoque_minimo,
      ativo,
    });

    if (error) {
      throw new Error(`Erro ao salvar material: ${error.message}`);
    }

    redirect("/dashboard/cadastros/recursos/materiais");
  }

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-2xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent_28%,transparent_72%,rgba(255,255,255,0.02))]" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF5017]/25 bg-[#FF5017]/10 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF5017]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#FF8A63] sm:text-xs">
                Cadastros &gt; Recursos &gt; Materiais
              </p>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Novo material
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Cadastre um novo material para utilizar em orçamento, compras,
              estoque e planejamento da obra.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/cadastros/recursos/materiais"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>

            <button
              form="novo-material-form"
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
            >
              <Save className="h-4 w-4" />
              Salvar material
            </button>
          </div>
        </div>
      </section>

      <MaterialFormClient
        action={createMaterial}
        grupos={grupos}
        subgrupos={subgrupos}
        unidadesMedida={unidadesMedida}
        fornecedores={fornecedores}
      />
    </div>
  );
}