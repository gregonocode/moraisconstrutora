import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Hash,
  Hammer,
  Package,
  Ruler,
  Save,
  Tag,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type GrupoRow = {
  id: string;
  nome: string;
};

type SubgrupoRow = {
  id: string;
  nome: string;
  grupo_id: string;
};

type UnidadeRow = {
  id: string;
  nome: string | null;
  sigla: string | null;
};

type FornecedorRow = {
  id: string;
  nome: string;
};

export default async function NovoEquipamentoPage() {
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

  const [gruposRes, subgruposRes, unidadesRes, fornecedoresRes] =
    await Promise.all([
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
        .from("unidades_medida")
        .select("id, nome, sigla")
        .order("sigla", { ascending: true }),
      supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("nome", { ascending: true }),
    ]);

  if (gruposRes.error) {
    throw new Error(`Erro ao carregar grupos: ${gruposRes.error.message}`);
  }

  if (subgruposRes.error) {
    throw new Error(`Erro ao carregar subgrupos: ${subgruposRes.error.message}`);
  }

  if (unidadesRes.error) {
    throw new Error(`Erro ao carregar unidades: ${unidadesRes.error.message}`);
  }

  if (fornecedoresRes.error) {
    throw new Error(
      `Erro ao carregar fornecedores: ${fornecedoresRes.error.message}`
    );
  }

  const grupos = (gruposRes.data ?? []) as GrupoRow[];
  const subgrupos = (subgruposRes.data ?? []) as SubgrupoRow[];
  const unidades = (unidadesRes.data ?? []) as UnidadeRow[];
  const fornecedores = (fornecedoresRes.data ?? []) as FornecedorRow[];

  async function criarEquipamento(formData: FormData) {
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

    const grupoId = nullableText(formData.get("grupo_id"));
    const subgrupoId = nullableText(formData.get("subgrupo_id"));
    const unidadeMedidaId = nullableText(formData.get("unidade_medida_id"));
    const fornecedorId = nullableText(formData.get("fornecedor_id"));
    const codigo = nullableText(formData.get("codigo"));
    const nome = String(formData.get("nome") ?? "").trim();
    const descricao = nullableText(formData.get("descricao"));
    const preco = nullableNumber(formData.get("preco")) ?? 0;
    const tipoControle = nullableText(formData.get("tipo_controle")) ?? "proprio";
    const ativo = formData.get("ativo") === "on";

    if (!nome) {
      throw new Error("O nome do equipamento é obrigatório.");
    }

    const { error } = await supabase.from("equipamentos").insert({
      user_id: userId,
      grupo_id: grupoId,
      subgrupo_id: subgrupoId,
      unidade_medida_id: unidadeMedidaId,
      fornecedor_id: fornecedorId,
      codigo,
      nome,
      descricao,
      preco,
      tipo_controle: tipoControle,
      ativo,
    });

    if (error) {
      throw new Error(`Erro ao criar equipamento: ${error.message}`);
    }

    revalidatePath("/dashboard/cadastros/recursos/equipamentos");
    redirect("/dashboard/cadastros/recursos/equipamentos");
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
                Cadastros &gt; Recursos
              </p>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Novo equipamento
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Cadastre um novo equipamento com grupo, subgrupo, unidade,
              fornecedor, preço e tipo de controle.
            </p>
          </div>

          <Link
            href="/dashboard/cadastros/recursos/equipamentos"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para listagem
          </Link>
        </div>
      </section>

      <form action={criarEquipamento} className="space-y-5 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <SectionTitle
              title="Informações principais"
              description="Preencha os dados base do equipamento."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Nome *"
                name="nome"
                placeholder="Ex: Betoneira 400L"
                icon={<Hammer className="h-4 w-4" />}
                required
              />

              <Field
                label="Código"
                name="codigo"
                placeholder="Ex: EQ-001"
                icon={<Hash className="h-4 w-4" />}
              />

              <Field
                label="Preço"
                name="preco"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                icon={<DollarSign className="h-4 w-4" />}
              />

              <div className="space-y-2">
                <Label>Grupo</Label>
                <select
                  name="grupo_id"
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
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
              </div>

              <div className="space-y-2">
                <Label>Subgrupo</Label>
                <select
                  name="subgrupo_id"
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="" className="bg-[#252525]">
                    Selecione um subgrupo
                  </option>
                  {subgrupos.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#252525]">
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Unidade de medida</Label>
                <select
                  name="unidade_medida_id"
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="" className="bg-[#252525]">
                    Selecione uma unidade
                  </option>
                  {unidades.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#252525]">
                      {item.sigla ? `${item.sigla}${item.nome ? ` - ${item.nome}` : ""}` : item.nome ?? "Sem nome"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <select
                  name="fornecedor_id"
                  defaultValue=""
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="" className="bg-[#252525]">
                    Selecione um fornecedor
                  </option>
                  {fornecedores.map((item) => (
                    <option key={item.id} value={item.id} className="bg-[#252525]">
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de controle</Label>
                <select
                  name="tipo_controle"
                  defaultValue="proprio"
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="proprio" className="bg-[#252525]">
                    Próprio
                  </option>
                  <option value="terceiro" className="bg-[#252525]">
                    Terceiro
                  </option>
                  <option value="locado" className="bg-[#252525]">
                    Locado
                  </option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="ativo"
                    defaultChecked
                    className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#FF5017]"
                  />
                  Equipamento ativo
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <SectionTitle
              title="Descrição"
              description="Detalhes complementares sobre o equipamento."
            />

            <div className="mt-5">
              <Label>Descrição</Label>
              <div className="mt-2 flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
                <span className="mt-0.5 text-white/35">
                  <Package className="h-4 w-4" />
                </span>
                <textarea
                  name="descricao"
                  rows={5}
                  placeholder="Descreva o equipamento, modelo, observações técnicas..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/cadastros/recursos/equipamentos"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            <Save className="h-4 w-4" />
            Salvar equipamento
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-sm text-white/50">{description}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-white/70">{children}</label>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  icon,
  required = false,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
        {icon ? <span className="text-white/35">{icon}</span> : null}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          step={step}
          min={min}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
      </div>
    </div>
  );
}

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return null;

  const num = Number(text);
  return Number.isNaN(num) ? null : num;
}