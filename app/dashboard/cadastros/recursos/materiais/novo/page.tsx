import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, Save } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

export default function NovoMaterialPage() {
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

      <form
        id="novo-material-form"
        action={createMaterial}
        className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-lg sm:rounded-[28px] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#181818]">
                  <Package className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Dados principais
                  </h2>
                  <p className="text-sm text-white/50">
                    Informações básicas do material.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <Label>Nome do material</Label>
                  <Input name="nome" placeholder="Ex: Cimento CP II 50kg" required />
                </Field>

                <Field>
                  <Label>Código</Label>
                  <Input name="codigo" placeholder="Ex: MAT-0001" />
                </Field>

                <Field className="md:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea name="descricao" placeholder="Descreva o material..." />
                </Field>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-lg sm:rounded-[28px] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

            <div className="relative z-10">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">
                  Classificação
                </h2>
                <p className="text-sm text-white/50">
                  Organize o material por grupo e subgrupo.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                  <Label>Grupo</Label>
                  <Select name="grupo_id" defaultValue="">
                    <option value="" className="bg-[#252525]">
                      Selecione um grupo
                    </option>
                  </Select>
                </Field>

                <Field>
                  <Label>Subgrupo</Label>
                  <Select name="subgrupo_id" defaultValue="">
                    <option value="" className="bg-[#252525]">
                      Selecione um subgrupo
                    </option>
                  </Select>
                </Field>

                <Field>
                  <Label>Unidade de medida</Label>
                  <Select name="unidade_medida_id" defaultValue="">
                    <option value="" className="bg-[#252525]">
                      Selecione
                    </option>
                  </Select>
                </Field>

                <Field>
                  <Label>Fornecedor</Label>
                  <Select name="fornecedor_id" defaultValue="">
                    <option value="" className="bg-[#252525]">
                      Selecione um fornecedor
                    </option>
                  </Select>
                </Field>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-lg sm:rounded-[28px] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.06),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_78%)]" />

            <div className="relative z-10">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">Valores</h2>
                <p className="text-sm text-white/50">
                  Controle preço e estoque mínimo.
                </p>
              </div>

              <div className="space-y-4">
                <Field>
                  <Label>Preço</Label>
                  <Input name="preco" placeholder="R$ 0,00" />
                </Field>

                <Field>
                  <Label>Estoque mínimo</Label>
                  <Input name="estoque_minimo" placeholder="0" />
                </Field>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-5 shadow-lg sm:rounded-[28px] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.06),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_78%)]" />

            <div className="relative z-10">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">Status</h2>
                <p className="text-sm text-white/50">
                  Defina se o material ficará ativo.
                </p>
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Material ativo
                  </p>
                  <p className="text-xs text-white/45">
                    Disponível para uso no sistema
                  </p>
                </div>

                <input
                  name="ativo"
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-white/20 bg-transparent accent-[#FF5017]"
                />
              </label>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[20px] border border-[#FF5017]/15 bg-[#252525] p-5 shadow-lg sm:rounded-[28px] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_42%)]" />

            <div className="relative z-10">
              <h3 className="text-base font-semibold text-white">
                Dica do cadastro
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Quanto melhor você organizar grupo, subgrupo e unidade de
                medida, mais fácil fica reutilizar esse material em orçamento,
                compras e estoque.
              </p>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}

function Field({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-white/80">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-12 w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF5017]/40 focus:ring-2 focus:ring-[#FF5017]/10"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-12 w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-[#FF5017]/40 focus:ring-2 focus:ring-[#FF5017]/10"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={4}
      className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF5017]/40 focus:ring-2 focus:ring-[#FF5017]/10"
    />
  );
}