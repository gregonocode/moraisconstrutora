"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Brain,
  Calculator,
  CircleDollarSign,
  ClipboardList,
  FileText,
  MessageSquareText,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

type ClienteRow = {
  id: string;
  nome: string;
};

type EmpresaRow = {
  id: string;
  nome: string;
};

type ComposicaoRow = {
  id: string;
  nome: string;
  custo_total?: number | null;
};

type MaterialRow = {
  id: string;
  nome: string;
  preco?: number | null;
};

type ServicoRow = {
  id: string;
  nome: string;
  custo_unitario?: number | null;
};

type ItemState = {
  id: string;
  tipo: "" | "composicao" | "material" | "servico";
  composicaoId: string;
  materialId: string;
  servicoId: string;
  descricao: string;
  quantidade: string;
  custoUnitario: string;
  vendaUnitaria: string;
};

function createEmptyItem(id: string): ItemState {
  return {
    id,
    tipo: "",
    composicaoId: "",
    materialId: "",
    servicoId: "",
    descricao: "",
    quantidade: "",
    custoUnitario: "",
    vendaUnitaria: "",
  };
}

export default function OrcamentoFormClient({
  action,
  modo,
  sugestaoCodigo,
  clientes,
  empresas,
  composicoes,
  materiais,
  servicos,
}: {
  action: (formData: FormData) => void | Promise<void>;
  modo: "ia" | "manual";
  sugestaoCodigo: string;
  clientes: ClienteRow[];
  empresas: EmpresaRow[];
  composicoes: ComposicaoRow[];
  materiais: MaterialRow[];
  servicos: ServicoRow[];
}) {
  const [itens, setItens] = useState<ItemState[]>([
    createEmptyItem("item-1"),
    createEmptyItem("item-2"),
  ]);
  const [nextItemNumber, setNextItemNumber] = useState(3);

  const totals = useMemo(() => {
    return itens.reduce(
      (acc, item) => {
        const quantidade = parseNumber(item.quantidade);
        const custoUnitario = parseNumber(item.custoUnitario);
        const vendaUnitaria = parseNumber(item.vendaUnitaria);

        acc.custo += quantidade * custoUnitario;
        acc.venda += quantidade * vendaUnitaria;
        return acc;
      },
      { custo: 0, venda: 0 }
    );
  }, [itens]);

  function addItem() {
    setItens((prev) => [...prev, createEmptyItem(`item-${nextItemNumber}`)]);
    setNextItemNumber((prev) => prev + 1);
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
      composicaoId: "",
      materialId: "",
      servicoId: "",
      descricao: "",
      quantidade: "",
      custoUnitario: "",
      vendaUnitaria: "",
    });
  }

  function handleComposicaoChange(id: string, composicaoId: string) {
    const composicao = composicoes.find((c) => c.id === composicaoId);
    const custo = composicao?.custo_total ?? 0;

    updateItem(id, {
      composicaoId,
      materialId: "",
      servicoId: "",
      descricao: composicao?.nome ?? "",
      custoUnitario: custo ? String(custo) : "",
      vendaUnitaria: custo ? String(custo) : "",
    });
  }

  function handleMaterialChange(id: string, materialId: string) {
    const material = materiais.find((m) => m.id === materialId);
    const custo = material?.preco ?? 0;

    updateItem(id, {
      composicaoId: "",
      materialId,
      servicoId: "",
      descricao: material?.nome ?? "",
      custoUnitario: custo ? String(custo) : "",
      vendaUnitaria: custo ? String(custo) : "",
    });
  }

  function handleServicoChange(id: string, servicoId: string) {
    const servico = servicos.find((s) => s.id === servicoId);
    const custo = servico?.custo_unitario ?? 0;

    updateItem(id, {
      composicaoId: "",
      materialId: "",
      servicoId,
      descricao: servico?.nome ?? "",
      custoUnitario: custo ? String(custo) : "",
      vendaUnitaria: custo ? String(custo) : "",
    });
  }

  return (
    <form action={action} className="space-y-4">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <CardBlock
          title="Informações básicas"
          description="Preencha os dados principais para iniciar o orçamento."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" name="codigo" defaultValue={sugestaoCodigo} />
            </Field>

            <Field>
              <Label htmlFor="titulo">Título do orçamento</Label>
              <Input
                id="titulo"
                name="titulo"
                placeholder="Ex: Residência unifamiliar - etapa estrutural"
                required
              />
            </Field>

            <Field>
              <Label htmlFor="empresa_id">Empresa</Label>
              <Select id="empresa_id" name="empresa_id" defaultValue="">
                <option value="" className="bg-[#252525] text-white">
                  Selecione uma empresa
                </option>
                {empresas.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="bg-[#252525] text-white"
                  >
                    {item.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label htmlFor="cliente_id">Cliente</Label>
              <Select id="cliente_id" name="cliente_id" defaultValue="">
                <option value="" className="bg-[#252525] text-white">
                  Selecione um cliente
                </option>
                {clientes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="bg-[#252525] text-white"
                  >
                    {item.nome}
                  </option>
                ))}
              </Select>
            </Field>

            <Field>
              <Label htmlFor="validade_em">Validade</Label>
              <Input id="validade_em" name="validade_em" type="date" />
            </Field>

            <Field>
              <Label htmlFor="margem_lucro">Margem de lucro (%)</Label>
              <Input
                id="margem_lucro"
                name="margem_lucro"
                type="number"
                step="0.01"
                placeholder="Ex: 15.00"
              />
            </Field>

            <Field className="sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                placeholder="Descreva o escopo, premissas e objetivo do orçamento."
              />
            </Field>

            <Field className="sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                placeholder="Condições comerciais, observações técnicas e detalhes complementares."
              />
            </Field>
          </div>
        </CardBlock>

        <CardBlock
          title={modo === "ia" ? "Entrada inteligente" : "Base operacional"}
          description={
            modo === "ia"
              ? "Campos pensados para orientar a futura geração de orçamento por IA."
              : "Referências internas já disponíveis para montar o orçamento manual."
          }
        >
          {modo === "ia" ? (
            <div className="space-y-4">
              <MiniInfo
                icon={<Brain className="h-4 w-4" />}
                label="Objetivo"
                value="Gerar uma estrutura inicial de orçamento a partir de um prompt técnico."
              />
              <MiniInfo
                icon={<MessageSquareText className="h-4 w-4" />}
                label="Prompt sugerido"
                value="Descreva o tipo de obra, padrão construtivo, escopo e restrições do cliente."
              />
              <MiniInfo
                icon={<CircleDollarSign className="h-4 w-4" />}
                label="Próxima etapa"
                value="Após gerar com IA, revisar itens, custos, venda e aprovação."
              />
              <div className="rounded-2xl border border-dashed border-[#FF5017]/20 bg-[#FF5017]/5 p-4 text-sm text-[#FFB39A]">
                Nesta primeira versão, o card inteligente já deixa o fluxo pronto visualmente.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <MiniInfo
                icon={<ClipboardList className="h-4 w-4" />}
                label="Composições disponíveis"
                value={`${composicoes.length} composição(ões) pronta(s) para apoiar o orçamento.`}
              />
              <MiniInfo
                icon={<FileText className="h-4 w-4" />}
                label="Materiais disponíveis"
                value={`${materiais.length} material(is) carregado(s) para composição de custo.`}
              />
              <MiniInfo
                icon={<Calculator className="h-4 w-4" />}
                label="Serviços disponíveis"
                value={`${servicos.length} serviço(s) vinculado(s) ao seu usuário.`}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MiniList
                  title="Composições recentes"
                  items={composicoes.map((item) => item.nome)}
                  emptyText="Nenhuma composição encontrada."
                />
                <MiniList
                  title="Serviços recentes"
                  items={servicos.map((item) => item.nome)}
                  emptyText="Nenhum serviço encontrado."
                />
              </div>
            </div>
          )}
        </CardBlock>
      </section>

      <CardBlock
        title="Estrutura inicial dos itens"
        description="Agora você já pode montar os itens reais do orçamento antes de salvar."
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#FF5017]/30 bg-[#FF5017]/10 px-4 py-2.5 text-sm font-medium text-[#FFB39A] transition hover:bg-[#FF5017]/15"
            >
              <Plus className="h-4 w-4" />
              Adicionar item
            </button>
          </div>

          {itens.map((item, index) => {
            const quantidade = parseNumber(item.quantidade);
            const custoUnitario = parseNumber(item.custoUnitario);
            const vendaUnitaria = parseNumber(item.vendaUnitaria);

            return (
              <div
                key={item.id}
                className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5017]/15 text-xs font-semibold text-[#FF8A63]">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium text-white">Item do orçamento</p>
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
                    <Label htmlFor={`item-tipo-${item.id}`}>Tipo</Label>
                    <Select
                      id={`item-tipo-${item.id}`}
                      name="item_tipo"
                      value={item.tipo}
                      onChange={(e) =>
                        handleTipoChange(
                          item.id,
                          e.target.value as ItemState["tipo"]
                        )
                      }
                    >
                      <option value="" className="bg-[#252525] text-white">
                        Selecione o tipo
                      </option>
                      <option
                        value="composicao"
                        className="bg-[#252525] text-white"
                      >
                        Composição
                      </option>
                      <option
                        value="material"
                        className="bg-[#252525] text-white"
                      >
                        Material
                      </option>
                      <option
                        value="servico"
                        className="bg-[#252525] text-white"
                      >
                        Serviço
                      </option>
                    </Select>
                  </div>

                  {item.tipo === "composicao" && (
                    <div className="space-y-2 xl:col-span-2">
                      <Label htmlFor={`item-composicao-${item.id}`}>Composição</Label>
                      <Select
                        id={`item-composicao-${item.id}`}
                        name="item_composicao_id"
                        value={item.composicaoId}
                        onChange={(e) =>
                          handleComposicaoChange(item.id, e.target.value)
                        }
                      >
                        <option value="" className="bg-[#252525] text-white">
                          Selecione uma composição
                        </option>
                        {composicoes.map((c) => (
                          <option
                            key={c.id}
                            value={c.id}
                            className="bg-[#252525] text-white"
                          >
                            {c.nome}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {item.tipo === "material" && (
                    <div className="space-y-2 xl:col-span-2">
                      <Label htmlFor={`item-material-${item.id}`}>Material</Label>
                      <Select
                        id={`item-material-${item.id}`}
                        name="item_material_id"
                        value={item.materialId}
                        onChange={(e) =>
                          handleMaterialChange(item.id, e.target.value)
                        }
                      >
                        <option value="" className="bg-[#252525] text-white">
                          Selecione um material
                        </option>
                        {materiais.map((m) => (
                          <option
                            key={m.id}
                            value={m.id}
                            className="bg-[#252525] text-white"
                          >
                            {m.nome}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {item.tipo === "servico" && (
                    <div className="space-y-2 xl:col-span-2">
                      <Label htmlFor={`item-servico-${item.id}`}>Serviço</Label>
                      <Select
                        id={`item-servico-${item.id}`}
                        name="item_servico_id"
                        value={item.servicoId}
                        onChange={(e) =>
                          handleServicoChange(item.id, e.target.value)
                        }
                      >
                        <option value="" className="bg-[#252525] text-white">
                          Selecione um serviço
                        </option>
                        {servicos.map((s) => (
                          <option
                            key={s.id}
                            value={s.id}
                            className="bg-[#252525] text-white"
                          >
                            {s.nome}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {item.tipo !== "composicao" && (
                    <input type="hidden" name="item_composicao_id" value="" />
                  )}
                  {item.tipo !== "material" && (
                    <input type="hidden" name="item_material_id" value="" />
                  )}
                  {item.tipo !== "servico" && (
                    <input type="hidden" name="item_servico_id" value="" />
                  )}

                  <Field className="xl:col-span-3">
                    <Label htmlFor={`item-desc-${item.id}`}>Descrição</Label>
                    <Input
                      id={`item-desc-${item.id}`}
                      name="item_descricao"
                      placeholder="Descrição do item"
                      value={item.descricao}
                      onChange={(e) =>
                        updateItem(item.id, { descricao: e.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <Label htmlFor={`item-qtd-${item.id}`}>Quantidade</Label>
                    <Input
                      id={`item-qtd-${item.id}`}
                      name="item_quantidade"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0"
                      value={item.quantidade}
                      onChange={(e) =>
                        updateItem(item.id, { quantidade: e.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <Label htmlFor={`item-custo-${item.id}`}>Custo unit.</Label>
                    <Input
                      id={`item-custo-${item.id}`}
                      name="item_custo_unitario"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0"
                      value={item.custoUnitario}
                      onChange={(e) =>
                        updateItem(item.id, { custoUnitario: e.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <Label htmlFor={`item-venda-${item.id}`}>Venda unit.</Label>
                    <Input
                      id={`item-venda-${item.id}`}
                      name="item_venda_unitaria"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0"
                      value={item.vendaUnitaria}
                      onChange={(e) =>
                        updateItem(item.id, { vendaUnitaria: e.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <Label htmlFor={`item-total-custo-${item.id}`}>Custo total</Label>
                    <div
                      id={`item-total-custo-${item.id}`}
                      className="flex h-[50px] items-center rounded-2xl border border-white/5 bg-white/[0.04] px-4 text-sm text-white/80"
                    >
                      R$ {formatMoney(quantidade * custoUnitario)}
                    </div>
                  </Field>

                  <Field>
                    <Label htmlFor={`item-total-venda-${item.id}`}>Total venda</Label>
                    <div
                      id={`item-total-venda-${item.id}`}
                      className="flex h-[50px] items-center rounded-2xl border border-white/5 bg-white/[0.04] px-4 text-sm text-white/80"
                    >
                      R$ {formatMoney(quantidade * vendaUnitaria)}
                    </div>
                  </Field>
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-4">
              <p className="text-sm text-white/50">Prévia do custo total</p>
              <p className="mt-2 text-xl font-semibold text-white">
                R$ {formatMoney(totals.custo)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#FF5017]/20 bg-[#FF5017]/5 px-4 py-4">
              <p className="text-sm text-[#FFB39A]">Prévia do valor de venda</p>
              <p className="mt-2 text-xl font-semibold text-white">
                R$ {formatMoney(totals.venda)}
              </p>
            </div>
          </div>
        </div>
      </CardBlock>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <TopAction href="/dashboard/orcamentos" variant="ghost">
          Cancelar
        </TopAction>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          <Save className="h-4 w-4" />
          Salvar orçamento
        </button>
      </div>
    </form>
  );
}

function parseNumber(value: string) {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function CardBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

      <div className="relative z-10">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="text-sm text-white/50">{description}</p> : null}
        </div>

        {children}
      </div>
    </section>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-2 text-white/70">
        {icon}
        <p className="text-xs uppercase tracking-[0.12em] text-white/35">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{value}</p>
    </div>
  );
}

function MiniList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-white/35">{title}</p>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-white/45">{emptyText}</p>
        ) : (
          items.slice(0, 5).map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-white/70"
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TopAction({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  variant?: "ghost" | "primary";
}) {
  const styles =
    variant === "primary"
      ? "bg-[#FF5017] text-white hover:brightness-110"
      : "border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]";

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition";

  return (
    <a href={href} className={`${base} ${styles}`}>
      {children}
    </a>
  );
}

function Field({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40"
    >
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-white/5 bg-[#2B2B2B] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition",
        "focus:border-[#FF5017]/30 focus:bg-[#303030]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-2xl border border-white/5 bg-[#2B2B2B] px-4 py-3 text-sm text-white outline-none transition",
        "focus:border-[#FF5017]/30 focus:bg-[#303030]",
        props.className ?? "",
      ].join(" ")}
    >
      {props.children}
    </select>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={4}
      className={[
        "w-full rounded-2xl border border-white/5 bg-[#2B2B2B] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition",
        "focus:border-[#FF5017]/30 focus:bg-[#303030]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
