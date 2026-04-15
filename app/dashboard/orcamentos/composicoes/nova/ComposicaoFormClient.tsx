"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Calculator, Package, Plus, Save, Trash2, Wrench } from "lucide-react";

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

type ItemState = {
  id: string;
  tipo: "" | "material" | "colaborador" | "servico";
  materialId: string;
  colaboradorId: string;
  servicoId: string;
  descricao: string;
  quantidade: string;
  custoUnitario: string;
};

function createEmptyItem(): ItemState {
  return {
    id: crypto.randomUUID(),
    tipo: "",
    materialId: "",
    colaboradorId: "",
    servicoId: "",
    descricao: "",
    quantidade: "",
    custoUnitario: "",
  };
}

export default function ComposicaoFormClient({
  action,
  empresas,
  unidades,
  materiais,
  colaboradores,
  servicos,
}: {
  action: (formData: FormData) => void | Promise<void>;
  empresas: EmpresaRow[];
  unidades: UnidadeRow[];
  materiais: MaterialRow[];
  colaboradores: ColaboradorRow[];
  servicos: ServicoRow[];
}) {
  const [itens, setItens] = useState<ItemState[]>([
    createEmptyItem(),
    createEmptyItem(),
  ]);

  const totalPreview = useMemo(() => {
    return itens.reduce((acc, item) => {
      const q = Number(String(item.quantidade).replace(",", ".")) || 0;
      const c = Number(String(item.custoUnitario).replace(",", ".")) || 0;
      return acc + q * c;
    }, 0);
  }, [itens]);

  function addItem() {
    setItens((prev) => [...prev, createEmptyItem()]);
  }

  function removeItem(id: string) {
    setItens((prev) =>
      prev.length > 1 ? prev.filter((item) => item.id !== id) : prev
    );
  }

  function updateItem(id: string, patch: Partial<ItemState>) {
    setItens((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function handleTipoChange(id: string, tipo: ItemState["tipo"]) {
    updateItem(id, {
      tipo,
      materialId: "",
      colaboradorId: "",
      servicoId: "",
      custoUnitario: "",
    });
  }

  function handleMaterialChange(id: string, materialId: string) {
    const material = materiais.find((m) => m.id === materialId);
    updateItem(id, {
      materialId,
      colaboradorId: "",
      servicoId: "",
      custoUnitario:
        material?.preco != null && Number.isFinite(material.preco)
          ? String(material.preco)
          : "",
    });
  }

  function handleColaboradorChange(id: string, colaboradorId: string) {
    const colaborador = colaboradores.find((c) => c.id === colaboradorId);
    updateItem(id, {
      materialId: "",
      colaboradorId,
      servicoId: "",
      custoUnitario:
        colaborador?.custo_hora != null && Number.isFinite(colaborador.custo_hora)
          ? String(colaborador.custo_hora)
          : "",
    });
  }

  function handleServicoChange(id: string, servicoId: string) {
    const servico = servicos.find((s) => s.id === servicoId);
    updateItem(id, {
      materialId: "",
      colaboradorId: "",
      servicoId,
      custoUnitario:
        servico?.custo_unitario != null &&
        Number.isFinite(servico.custo_unitario)
          ? String(servico.custo_unitario)
          : "",
    });
  }

  return (
    <form action={action} className="space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(26,25,25,0.4),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <SectionTitle
            title="Dados da composição"
            description="Preencha as informações principais da composição."
          />

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Nome *"
              name="nome"
              placeholder="Ex: Assentamento de piso cerâmico"
              icon={<Calculator className="h-4 w-4" />}
              required
            />

            <Field
              label="Código"
              name="codigo"
              placeholder="Ex: COMP-001"
              icon={<Calculator className="h-4 w-4" />}
            />

            <div className="space-y-2">
              <Label>Empresa</Label>
              <select
                name="empresa_id"
                defaultValue=""
                className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="" className="bg-[#252525]">
                  Selecione uma empresa
                </option>
                {empresas.map((item) => (
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
                    {item.sigla
                      ? `${item.sigla}${item.nome ? ` - ${item.nome}` : ""}`
                      : item.nome ?? "Sem nome"}
                  </option>
                ))}
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
                Composição ativa
              </label>
            </div>
          </div>

          <div className="mt-5">
            <Label>Descrição</Label>
            <textarea
              name="descricao"
              rows={4}
              placeholder="Descreva o objetivo e o escopo da composição..."
              className="mt-2 w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.69),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle
              title="Itens da composição"
              description="Adicione recursos que formam essa composição."
            />

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#FF5017]/30 bg-[#FF5017]/10 px-4 py-2.5 text-sm font-medium text-[#FFB39A] transition hover:bg-[#FF5017]/15"
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </button>
          </div>

          {itens.map((item, index) => (
            <div
              key={item.id}
              className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5017]/15 text-xs font-semibold text-[#FF8A63]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-white">
                    Item da composição
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={itens.length === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>Tipo do item</Label>
                  <select
                    name="item_tipo"
                    value={item.tipo}
                    onChange={(e) =>
                      handleTipoChange(
                        item.id,
                        e.target.value as ItemState["tipo"]
                      )
                    }
                    className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="" className="bg-[#252525]">
                      Selecione o tipo
                    </option>
                    <option value="material" className="bg-[#252525]">
                      Material
                    </option>
                    <option value="colaborador" className="bg-[#252525]">
                      Mão de obra
                    </option>
                    <option value="servico" className="bg-[#252525]">
                      Serviço
                    </option>
                  </select>
                </div>

                {item.tipo === "material" && (
                  <div className="space-y-2 xl:col-span-2">
                    <Label>Material</Label>
                    <select
                      name="item_material_id"
                      value={item.materialId}
                      onChange={(e) => handleMaterialChange(item.id, e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-[#252525]">
                        Selecione um material
                      </option>
                      {materiais.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[#252525]">
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {item.tipo === "colaborador" && (
                  <div className="space-y-2 xl:col-span-2">
                    <Label>Mão de obra</Label>
                    <select
                      name="item_colaborador_id"
                      value={item.colaboradorId}
                      onChange={(e) =>
                        handleColaboradorChange(item.id, e.target.value)
                      }
                      className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-[#252525]">
                        Selecione um colaborador
                      </option>
                      {colaboradores.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#252525]">
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {item.tipo === "servico" && (
                  <div className="space-y-2 xl:col-span-2">
                    <Label>Serviço</Label>
                    <select
                      name="item_servico_id"
                      value={item.servicoId}
                      onChange={(e) => handleServicoChange(item.id, e.target.value)}
                      className="w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="" className="bg-[#252525]">
                        Selecione um serviço
                      </option>
                      {servicos.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#252525]">
                          {s.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {item.tipo !== "material" && (
                  <input type="hidden" name="item_material_id" value="" />
                )}
                {item.tipo !== "colaborador" && (
                  <input type="hidden" name="item_colaborador_id" value="" />
                )}
                {item.tipo !== "servico" && (
                  <input type="hidden" name="item_servico_id" value="" />
                )}

                <div className="xl:col-span-3">
                  <Field
                    label="Descrição do item"
                    name="item_descricao"
                    placeholder="Ex: Argamassa ACIII / Pedreiro / Assentamento"
                    icon={<Wrench className="h-4 w-4" />}
                    value={item.descricao}
                    onChange={(e) =>
                      updateItem(item.id, { descricao: e.target.value })
                    }
                  />
                </div>

                <Field
                  label="Quantidade"
                  name="item_quantidade"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0"
                  icon={<Package className="h-4 w-4" />}
                  value={item.quantidade}
                  onChange={(e) =>
                    updateItem(item.id, { quantidade: e.target.value })
                  }
                />

                <Field
                  label="Custo unitário"
                  name="item_custo_unitario"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0"
                  icon={<Calculator className="h-4 w-4" />}
                  value={item.custoUnitario}
                  onChange={(e) =>
                    updateItem(item.id, { custoUnitario: e.target.value })
                  }
                />

                <div className="space-y-2">
                  <Label>Total do item</Label>
                  <div className="flex h-[50px] items-center rounded-2xl border border-white/5 bg-white/[0.04] px-4 text-sm text-white/80">
                    R$ {formatMoney(calcTotal(item.quantidade, item.custoUnitario))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-[#FF5017]/20 bg-[#FF5017]/5 px-4 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#FFB39A]">Prévia do custo total</p>
              <p className="text-lg font-semibold text-white">
                R$ {formatMoney(totalPreview)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
        >
          <Save className="h-4 w-4" />
          Salvar composição
        </button>
      </div>
    </form>
  );
}

function calcTotal(quantidade: string, custoUnitario: string) {
  const q = Number(String(quantidade).replace(",", ".")) || 0;
  const c = Number(String(custoUnitario).replace(",", ".")) || 0;
  return q * c;
}

function formatMoney(value: number) {
  return value.toFixed(2).replace(".", ",");
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

function Label({ children }: { children: ReactNode }) {
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
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  required?: boolean;
  step?: string;
  min?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
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
          value={value}
          onChange={onChange}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
        />
      </div>
    </div>
  );
}