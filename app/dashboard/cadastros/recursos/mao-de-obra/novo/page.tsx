import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type CargoRow = {
  id: string;
  nome: string;
};

type EmpresaRow = {
  id: string;
  nome: string;
};

export default async function NovoColaboradorPage() {
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

  const [cargosRes, empresasRes] = await Promise.all([
    supabase
      .from("cargos")
      .select("id, nome")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("empresas")
      .select("id, nome")
      .eq("user_id", userId)
      .eq("ativo", true)
      .order("nome", { ascending: true }),
  ]);

  if (cargosRes.error) {
    throw new Error(`Erro ao carregar cargos: ${cargosRes.error.message}`);
  }

  if (empresasRes.error) {
    throw new Error(`Erro ao carregar empresas: ${empresasRes.error.message}`);
  }

  const cargos = (cargosRes.data ?? []) as CargoRow[];
  const empresas = (empresasRes.data ?? []) as EmpresaRow[];

  async function criarColaborador(formData: FormData) {
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
    const cpf = nullableText(formData.get("cpf"));
    const rg = nullableText(formData.get("rg"));
    const telefone = nullableText(formData.get("telefone"));
    const email = nullableText(formData.get("email"));
    const cargoTexto = nullableText(formData.get("cargo"));
    const funcao = nullableText(formData.get("funcao"));
    const empresaId = nullableText(formData.get("empresa_id"));
    const cargoId = nullableText(formData.get("cargo_id"));
    const salarioBase = nullableNumber(formData.get("salario_base"));
    const custoHora = nullableNumber(formData.get("custo_hora"));
    const dataAdmissao = nullableText(formData.get("data_admissao"));
    const dataDemissao = nullableText(formData.get("data_demissao"));
    const endereco = nullableText(formData.get("endereco"));
    const numero = nullableText(formData.get("numero"));
    const complemento = nullableText(formData.get("complemento"));
    const bairro = nullableText(formData.get("bairro"));
    const cidade = nullableText(formData.get("cidade"));
    const estado = nullableText(formData.get("estado"));
    const cep = nullableText(formData.get("cep"));
    const observacoes = nullableText(formData.get("observacoes"));
    const ativo = formData.get("ativo") === "on";

    if (!nome) {
      throw new Error("O nome do colaborador é obrigatório.");
    }

    const { error } = await supabase.from("colaboradores").insert({
      user_id: userId,
      empresa_id: empresaId,
      nome,
      cpf,
      rg,
      telefone,
      email,
      cargo: cargoTexto,
      funcao,
      salario_base: salarioBase ?? 0,
      custo_hora: custoHora ?? 0,
      data_admissao: dataAdmissao,
      data_demissao: dataDemissao,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      observacoes,
      cargo_id: cargoId,
      ativo,
    });

    if (error) {
      throw new Error(`Erro ao criar colaborador: ${error.message}`);
    }

    revalidatePath("/dashboard/cadastros/recursos/mao-de-obra");
    redirect("/dashboard/cadastros/recursos/mao-de-obra");
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
              Novo colaborador
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base">
              Cadastre um novo profissional da sua operação com dados pessoais,
              cargo, custos e informações de admissão.
            </p>
          </div>

          <Link
            href="/dashboard/cadastros/recursos/mao-de-obra"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para listagem
          </Link>
        </div>
      </section>

      <form action={criarColaborador} className="space-y-5 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <SectionTitle
              title="Informações principais"
              description="Preencha os dados essenciais do colaborador."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Nome completo *"
                name="nome"
                placeholder="Ex: João da Silva"
                icon={<User className="h-4 w-4" />}
                required
              />

              <Field
                label="CPF"
                name="cpf"
                placeholder="000.000.000-00"
                icon={<User className="h-4 w-4" />}
              />

              <Field
                label="RG"
                name="rg"
                placeholder="Ex: 123456789"
                icon={<User className="h-4 w-4" />}
              />

              <Field
                label="Telefone"
                name="telefone"
                placeholder="(00) 00000-0000"
                icon={<Phone className="h-4 w-4" />}
              />

              <Field
                label="E-mail"
                name="email"
                type="email"
                placeholder="colaborador@email.com"
                icon={<Mail className="h-4 w-4" />}
              />

              <div className="space-y-2">
                <Label>Empresa</Label>
                <select
                  name="empresa_id"
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  defaultValue=""
                >
                  <option value="" className="bg-[#252525]">
                    Selecione uma empresa
                  </option>
                  {empresas.map((empresa) => (
                    <option
                      key={empresa.id}
                      value={empresa.id}
                      className="bg-[#252525]"
                    >
                      {empresa.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Cargo vinculado</Label>
                <select
                  name="cargo_id"
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  defaultValue=""
                >
                  <option value="" className="bg-[#252525]">
                    Selecione um cargo
                  </option>
                  {cargos.map((cargo) => (
                    <option
                      key={cargo.id}
                      value={cargo.id}
                      className="bg-[#252525]"
                    >
                      {cargo.nome}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label="Cargo (texto)"
                name="cargo"
                placeholder="Ex: Pedreiro"
                icon={<Briefcase className="h-4 w-4" />}
              />

              <Field
                label="Função"
                name="funcao"
                placeholder="Ex: Alvenaria estrutural"
                icon={<Briefcase className="h-4 w-4" />}
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <SectionTitle
              title="Custos e datas"
              description="Defina custos principais e datas do vínculo."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="Salário base"
                name="salario_base"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                icon={<DollarSign className="h-4 w-4" />}
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

              <Field
                label="Data de admissão"
                name="data_admissao"
                type="date"
                icon={<CalendarDays className="h-4 w-4" />}
              />

              <Field
                label="Data de demissão"
                name="data_demissao"
                type="date"
                icon={<CalendarDays className="h-4 w-4" />}
              />
            </div>

            <div className="mt-5">
              <label className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white">
                <input
                  type="checkbox"
                  name="ativo"
                  defaultChecked
                  className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#FF5017]"
                />
                Colaborador ativo
              </label>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <SectionTitle
              title="Endereço"
              description="Informações residenciais do colaborador."
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field
                label="CEP"
                name="cep"
                placeholder="00000-000"
                icon={<MapPin className="h-4 w-4" />}
              />

              <Field
                label="Endereço"
                name="endereco"
                placeholder="Rua, avenida..."
                icon={<MapPin className="h-4 w-4" />}
                className="xl:col-span-2"
              />

              <Field
                label="Número"
                name="numero"
                placeholder="Ex: 123"
                icon={<Building2 className="h-4 w-4" />}
              />

              <Field
                label="Complemento"
                name="complemento"
                placeholder="Apto, bloco..."
                icon={<Building2 className="h-4 w-4" />}
              />

              <Field
                label="Bairro"
                name="bairro"
                placeholder="Ex: Centro"
                icon={<MapPin className="h-4 w-4" />}
              />

              <Field
                label="Cidade"
                name="cidade"
                placeholder="Ex: Betim"
                icon={<MapPin className="h-4 w-4" />}
              />

              <Field
                label="Estado"
                name="estado"
                placeholder="Ex: MG"
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

          <div className="relative z-10">
            <SectionTitle
              title="Observações"
              description="Anotações adicionais sobre o colaborador."
            />

            <div className="mt-5">
              <Label>Observações</Label>
              <textarea
                name="observacoes"
                rows={5}
                placeholder="Escreva observações relevantes..."
                className="mt-2 w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/cadastros/recursos/mao-de-obra"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            <Save className="h-4 w-4" />
            Salvar colaborador
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
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  step?: string;
  min?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
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