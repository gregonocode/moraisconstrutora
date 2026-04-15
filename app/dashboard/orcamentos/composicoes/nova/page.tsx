import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Save } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import ComposicaoFormClient from "./ComposicaoFormClient";

type EmpresaRow = {
  id: string;
  nome: string;
};

type UnidadeRow = {
  id: string;
  nome: string | null;
  sigla: string | null;
};

type MaterialRow = {
  id: string;
  nome: string;
  preco: number | null;
};

type ColaboradorRow = {
  id: string;
  nome: string;
  custo_hora: number | null;
};

type ServicoRow = {
  id: string;
  nome: string;
  custo_unitario: number | null;
};

export default async function NovaComposicaoPage() {
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

  const [empresasRes, unidadesRes, materiaisRes, colaboradoresRes, servicosRes] =
    await Promise.all([
      supabase
        .from("empresas")
        .select("id, nome")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("nome", { ascending: true }),

      supabase
        .from("unidades_medida")
        .select("id, nome, sigla")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("sigla", { ascending: true }),

      supabase
        .from("materiais")
        .select("id, nome, preco")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("nome", { ascending: true }),

      supabase
        .from("colaboradores")
        .select("id, nome, custo_hora")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("nome", { ascending: true }),

      supabase
        .from("servicos")
        .select("id, nome, custo_unitario")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("nome", { ascending: true }),
    ]);

  if (empresasRes.error) {
    throw new Error(`Erro ao carregar empresas: ${empresasRes.error.message}`);
  }
  if (unidadesRes.error) {
    throw new Error(`Erro ao carregar unidades: ${unidadesRes.error.message}`);
  }
  if (materiaisRes.error) {
    throw new Error(`Erro ao carregar materiais: ${materiaisRes.error.message}`);
  }
  if (colaboradoresRes.error) {
    throw new Error(
      `Erro ao carregar mão de obra: ${colaboradoresRes.error.message}`
    );
  }
  if (servicosRes.error) {
    throw new Error(`Erro ao carregar serviços: ${servicosRes.error.message}`);
  }

  const empresas = (empresasRes.data ?? []) as EmpresaRow[];
  const unidades = (unidadesRes.data ?? []) as UnidadeRow[];
  const materiais = (materiaisRes.data ?? []) as MaterialRow[];
  const colaboradores = (colaboradoresRes.data ?? []) as ColaboradorRow[];
  const servicos = (servicosRes.data ?? []) as ServicoRow[];

  async function criarComposicao(formData: FormData) {
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

    const empresaId = nullableText(formData.get("empresa_id"));
    const unidadeMedidaId = nullableText(formData.get("unidade_medida_id"));
    const codigo = nullableText(formData.get("codigo"));
    const nome = String(formData.get("nome") ?? "").trim();
    const descricao = nullableText(formData.get("descricao"));
    const ativo = formData.get("ativo") === "on";

    if (!nome) {
      throw new Error("O nome da composição é obrigatório.");
    }

    const tipos = formData.getAll("item_tipo").map((v) => String(v));
    const materialIds = formData.getAll("item_material_id").map((v) => String(v));
    const colaboradorIds = formData
      .getAll("item_colaborador_id")
      .map((v) => String(v));
    const servicoIds = formData.getAll("item_servico_id").map((v) => String(v));
    const descricoes = formData.getAll("item_descricao").map((v) => String(v));
    const quantidades = formData.getAll("item_quantidade").map((v) => String(v));
    const custosUnitarios = formData
      .getAll("item_custo_unitario")
      .map((v) => String(v));

    const itens: Array<{
      user_id: string;
      composicao_id: string;
      tipo_item: string;
      material_id: string | null;
      colaborador_id: string | null;
      servico_id: string | null;
      descricao: string | null;
      quantidade: number;
      custo_unitario: number;
      custo_total: number;
    }> = [];

    for (let i = 0; i < tipos.length; i++) {
      const tipoItem = (tipos[i] ?? "").trim();
      const quantidade = toNumber(quantidades[i]);
      const custoUnitario = toNumber(custosUnitarios[i]);
      const custoTotal = quantidade * custoUnitario;

      const materialId = emptyToNull(materialIds[i]);
      const colaboradorId = emptyToNull(colaboradorIds[i]);
      const servicoId = emptyToNull(servicoIds[i]);
      const descricaoItem = emptyToNull(descricoes[i]);

      const hasValidTarget =
        (tipoItem === "material" && materialId) ||
        (tipoItem === "colaborador" && colaboradorId) ||
        (tipoItem === "servico" && servicoId);

      if (!tipoItem || !hasValidTarget || quantidade <= 0) {
        continue;
      }

      itens.push({
        user_id: userId,
        composicao_id: "",
        tipo_item: tipoItem,
        material_id: tipoItem === "material" ? materialId : null,
        colaborador_id: tipoItem === "colaborador" ? colaboradorId : null,
        servico_id: tipoItem === "servico" ? servicoId : null,
        descricao: descricaoItem,
        quantidade,
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
      });
    }

    const custoTotalComposicao = itens.reduce(
      (acc, item) => acc + item.custo_total,
      0
    );

    const { data: composicaoCriada, error: composicaoError } = await supabase
      .from("composicoes")
      .insert({
        user_id: userId,
        empresa_id: empresaId,
        codigo,
        nome,
        descricao,
        unidade_medida_id: unidadeMedidaId,
        custo_total: custoTotalComposicao,
        ativo,
      })
      .select("id")
      .single();

    if (composicaoError) {
      throw new Error(`Erro ao criar composição: ${composicaoError.message}`);
    }

    if (itens.length > 0) {
      const composicaoId = composicaoCriada.id as string;

      const itensFinal = itens.map((item) => ({
        ...item,
        composicao_id: composicaoId,
      }));

      const { error: itensError } = await supabase
        .from("composicao_itens")
        .insert(itensFinal);

      if (itensError) {
        throw new Error(
          `Erro ao criar itens da composição: ${itensError.message}`
        );
      }
    }

    revalidatePath("/dashboard/orcamentos/composicoes");
    redirect("/dashboard/orcamentos/composicoes");
  }

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-2xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.84),transparent_54%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.02),transparent_42%)]" />
        <div className="absolute inset-0" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Nova composição
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Monte uma composição com materiais, mão de obra e serviços para
              usar nos seus orçamentos.
            </p>
          </div>

          <Link
            href="/dashboard/orcamentos/composicoes"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para listagem
          </Link>
        </div>
      </section>

      <ComposicaoFormClient
        action={criarComposicao}
        empresas={empresas}
        unidades={unidades}
        materiais={materiais}
        colaboradores={colaboradores}
        servicos={servicos}
      />
    </div>
  );
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
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