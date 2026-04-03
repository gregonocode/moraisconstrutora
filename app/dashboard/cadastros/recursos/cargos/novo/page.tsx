import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  FileText,
  Save,
  ToggleLeft,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

export default async function NovoCargoFuncaoPage() {
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

  async function criarCargo(formData: FormData) {
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

    const nome = String(formData.get("nome") ?? "").trim();
    const descricao = nullableText(formData.get("descricao"));
    const custoHora = nullableNumber(formData.get("custo_hora")) ?? 0;
    const ativo = formData.get("ativo") === "on";

    if (!nome) {
      throw new Error("O nome do cargo é obrigatório.");
    }

    const { error } = await supabase.from("cargos").insert({
      user_id: userId,
      nome,
      descricao,
      custo_hora: custoHora,
      ativo,
    });

    if (error) {
      throw new Error(`Erro ao criar cargo: ${error.message}`);
    }

    revalidatePath("/dashboard/cadastros/recursos/cargos");
    redirect("/dashboard/cadastros/recursos/cargos");
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
              Novo cargo / função
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Cadastre um novo cargo para organizar sua equipe com descrição,
              custo por hora e status.
            </p>
          </div>

          <Link
            href="/dashboard/cadastros/recursos/cargo-funcao"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para listagem
          </Link>
        </div>
      </section>

      <form action={criarCargo} className="space-y-5 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <SectionTitle
              title="Dados do cargo"
              description="Preencha as informações principais para cadastrar o cargo."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Nome do cargo *"
                name="nome"
                placeholder="Ex: Pedreiro"
                icon={<Briefcase className="h-4 w-4" />}
                required
              />

              <Field
                label="Custo por hora"
                name="custo_hora"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                icon={<DollarSign className="h-4 w-4" />}
              />
            </div>

            <div className="mt-5">
              <Label>Descrição</Label>
              <div className="mt-2 flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
                <span className="mt-0.5 text-white/35">
                  <FileText className="h-4 w-4" />
                </span>
                <textarea
                  name="descricao"
                  rows={5}
                  placeholder="Descreva as responsabilidades ou detalhes desse cargo..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white">
                <input
                  type="checkbox"
                  name="ativo"
                  defaultChecked
                  className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#FF5017]"
                />
                <span className="inline-flex items-center gap-2">
                  <ToggleLeft className="h-4 w-4 text-[#FF8A63]" />
                  Cargo ativo
                </span>
              </label>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/cadastros/recursos/cargo-funcao"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            <Save className="h-4 w-4" />
            Salvar cargo
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