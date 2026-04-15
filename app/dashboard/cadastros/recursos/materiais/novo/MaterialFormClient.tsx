"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Package } from "lucide-react";

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

export default function MaterialFormClient({
  action,
  grupos,
  subgrupos,
  unidadesMedida,
  fornecedores,
}: {
  action: (formData: FormData) => void | Promise<void>;
  grupos: GrupoRow[];
  subgrupos: SubgrupoRow[];
  unidadesMedida: UnidadeMedidaRow[];
  fornecedores: FornecedorRow[];
}) {
  const [grupoId, setGrupoId] = useState("");

  const subgruposFiltrados = useMemo(() => {
    if (!grupoId) return [];
    return subgrupos.filter((subgrupo) => subgrupo.grupo_id === grupoId);
  }, [grupoId, subgrupos]);

  return (
    <form
      id="novo-material-form"
      action={action}
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
                <Input
                  name="nome"
                  placeholder="Ex: Cimento CP II 50kg"
                  required
                />
              </Field>

              <Field>
                <Label>Código</Label>
                <Input name="codigo" placeholder="Ex: MAT-0001" />
              </Field>

              <Field className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  name="descricao"
                  placeholder="Descreva o material..."
                />
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
                <Select
                  name="grupo_id"
                  value={grupoId}
                  onChange={(e) => setGrupoId(e.target.value)}
                >
                  <option value="" className="bg-[#252525]">
                    Selecione um grupo
                  </option>
                  {grupos.map((grupo) => (
                    <option
                      key={grupo.id}
                      value={grupo.id}
                      className="bg-[#252525]"
                    >
                      {grupo.nome}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label>Subgrupo</Label>
                <Select
                  name="subgrupo_id"
                  defaultValue=""
                  disabled={!grupoId}
                >
                  <option value="" className="bg-[#252525]">
                    {grupoId
                      ? "Selecione um subgrupo"
                      : "Selecione um grupo antes"}
                  </option>
                  {subgruposFiltrados.map((subgrupo) => (
                    <option
                      key={subgrupo.id}
                      value={subgrupo.id}
                      className="bg-[#252525]"
                    >
                      {subgrupo.nome}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label>Unidade de medida</Label>
                <Select name="unidade_medida_id" defaultValue="">
                  <option value="" className="bg-[#252525]">
                    Selecione
                  </option>
                  {unidadesMedida.map((unidade) => (
                    <option
                      key={unidade.id}
                      value={unidade.id}
                      className="bg-[#252525]"
                    >
                      {unidade.sigla
                        ? `${unidade.sigla} - ${unidade.nome}`
                        : unidade.nome}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Label>Fornecedor</Label>
                <Select name="fornecedor_id" defaultValue="">
                  <option value="" className="bg-[#252525]">
                    Selecione um fornecedor
                  </option>
                  {fornecedores.map((fornecedor) => (
                    <option
                      key={fornecedor.id}
                      value={fornecedor.id}
                      className="bg-[#252525]"
                    >
                      {fornecedor.nome}
                    </option>
                  ))}
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
                <p className="text-sm font-medium text-white">Material ativo</p>
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
  );
}

function Field({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function Label({ children }: { children: ReactNode }) {
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
      className="h-12 w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-[#FF5017]/40 focus:ring-2 focus:ring-[#FF5017]/10 disabled:cursor-not-allowed disabled:opacity-60"
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