// app/dashboard/orcamentos/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileDown,
  FileSpreadsheet,
  Pencil,
  ShieldAlert,
  User2,
  Wallet,
  Building2,
  Clock3,
  FileText,
  MapPin,
  Phone,
  Mail,
  Layers3,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type OrcamentoStatus =
  | "rascunho"
  | "enviado"
  | "aprovado"
  | "reprovado"
  | "cancelado"
  | "convertido";

type ClienteRow = {
  nome: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
}[];

type OrcamentoRow = {
  id: string;
  user_id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  obra_id: string | null;
  codigo: string | null;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  valor_total: number | string;
  custo_total: number | string;
  margem_lucro: number | string | null;
  status: OrcamentoStatus;
  validade_em: string | null;
  aprovado_em: string | null;
  observacoes: string | null;
  modalidade_contratacao: string | null;
  prazo_estimado: string | null;
  escopo_resumido: string | null;
  inclui_materiais: boolean | null;
  inclui_mao_de_obra: boolean | null;
  inclui_equipamentos: boolean | null;
  texto_apresentacao: string | null;
  diferenciais: unknown;
  escopo_pdf: unknown;
  condicoes_comerciais: string | null;
  garantia_texto: string | null;
  proximos_passos: unknown;
  proposta_modelo: string | null;
  created_at: string;
  updated_at: string;
  cliente: ClienteRow | null;
};

type OrcamentoItemRow = {
  id: string;
  orcamento_id: string;
  etapa_id: string | null;
  tipo_item: string;
  descricao: string;
  quantidade: number | string;
  custo_unitario: number | string;
  venda_unitaria: number | string;
  custo_total: number | string | null;
  venda_total: number | string | null;
  ordem: number;
  created_at: string;
};

type OrcamentoEtapaRow = {
  id: string;
  orcamento_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  valor_total: number | string;
  created_at: string;
};

export default async function OrcamentoDetalhePage({ params }: PageProps) {
  const { id } = await params;

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
    .select("id, nome")
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
    { data: orcamentoData, error: orcamentoError },
    { data: itensData, error: itensError },
    { data: etapasData, error: etapasError },
  ] = await Promise.all([
    supabase
      .from("orcamentos")
      .select(
        `
          id,
          user_id,
          empresa_id,
          cliente_id,
          obra_id,
          codigo,
          titulo,
          subtitulo,
          descricao,
          valor_total,
          custo_total,
          margem_lucro,
          status,
          validade_em,
          aprovado_em,
          observacoes,
          modalidade_contratacao,
          prazo_estimado,
          escopo_resumido,
          inclui_materiais,
          inclui_mao_de_obra,
          inclui_equipamentos,
          texto_apresentacao,
          diferenciais,
          escopo_pdf,
          condicoes_comerciais,
          garantia_texto,
          proximos_passos,
          proposta_modelo,
          created_at,
          updated_at,
          cliente:clientes(
            nome,
            telefone,
            email,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep
          )
        `
      )
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("orcamento_itens")
      .select(
        `
          id,
          orcamento_id,
          etapa_id,
          tipo_item,
          descricao,
          quantidade,
          custo_unitario,
          venda_unitaria,
          custo_total,
          venda_total,
          ordem,
          created_at
        `
      )
      .eq("orcamento_id", id)
      .eq("user_id", userId)
      .order("ordem", { ascending: true }),

    supabase
      .from("orcamento_etapas")
      .select(
        `
          id,
          orcamento_id,
          nome,
          descricao,
          ordem,
          valor_total,
          created_at
        `
      )
      .eq("orcamento_id", id)
      .eq("user_id", userId)
      .order("ordem", { ascending: true }),
  ]);

  if (orcamentoError) {
    throw new Error(`Erro ao carregar orçamento: ${orcamentoError.message}`);
  }

  if (itensError) {
    throw new Error(`Erro ao carregar itens do orçamento: ${itensError.message}`);
  }

  if (etapasError) {
    throw new Error(`Erro ao carregar etapas do orçamento: ${etapasError.message}`);
  }

  if (!orcamentoData) {
    notFound();
  }

  const orcamento = orcamentoData as OrcamentoRow;
  const itens = (itensData ?? []) as OrcamentoItemRow[];
  const etapas = (etapasData ?? []) as OrcamentoEtapaRow[];
  const cliente = orcamento.cliente?.[0] ?? null;

  const valorTotal = Number(orcamento.valor_total ?? 0);
  const custoTotal = Number(orcamento.custo_total ?? 0);
  const margemLucro =
    orcamento.margem_lucro !== null && orcamento.margem_lucro !== undefined
      ? Number(orcamento.margem_lucro)
      : valorTotal > 0
        ? ((valorTotal - custoTotal) / valorTotal) * 100
        : 0;

  const totalItens = itens.length;
  const itensPorTipo = buildItemsByType(itens);
  const itensPorEtapa = buildItemsByEtapa(itens, etapas);

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.12),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <Link
                href="/dashboard/orcamentos"
                className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para orçamentos
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={orcamento.status} />
                {orcamento.codigo ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/60">
                    {orcamento.codigo}
                  </span>
                ) : null}
                {orcamento.proposta_modelo ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/60">
                    {orcamento.proposta_modelo.replaceAll("_", " ")}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {orcamento.titulo}
              </h1>

              {orcamento.subtitulo?.trim() ? (
                <p className="mt-2 text-sm text-[#FF8A63] sm:text-base">
                  {orcamento.subtitulo}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/50">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Criado em {formatDateTime(orcamento.created_at)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <User2 className="h-4 w-4" />
                  {cliente?.nome ?? "Sem cliente"}
                </span>
              </div>

              {orcamento.descricao?.trim() ? (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                  {orcamento.descricao}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ActionButton href={`/dashboard/orcamentos/${orcamento.id}/editar`}>
                <Pencil className="h-4 w-4" />
                Editar
              </ActionButton>

              <ActionButton
             href={`/api/orcamentos/${orcamento.id}/pdf`}
             variant="ghost"
             target="_blank"
             >
            <FileDown className="h-4 w-4" />
              PDF
            </ActionButton>

              <ActionButton asDisabled variant="success">
                <CheckCircle2 className="h-4 w-4" />
                Aprovar
              </ActionButton>

              <ActionButton asDisabled variant="danger">
                <ShieldAlert className="h-4 w-4" />
                Reprovar
              </ActionButton>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Valor total"
          value={formatCurrency(valorTotal)}
          icon={<CircleDollarSign className="h-5 w-5" />}
          highlight
        />
        <SummaryCard
          title="Custo total"
          value={formatCurrency(custoTotal)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <SummaryCard
          title="Margem"
          value={`${margemLucro.toFixed(2).replace(".", ",")}%`}
          icon={<FileSpreadsheet className="h-5 w-5" />}
        />
        <SummaryCard
          title="Itens"
          value={String(totalItens)}
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CardBlock
          title="Informações básicas"
          description="Dados principais e comerciais do orçamento."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoItem label="Código" value={orcamento.codigo ?? "Sem código"} />
            <InfoItem label="Status" value={translateStatus(orcamento.status)} />
            <InfoItem label="Cliente" value={cliente?.nome ?? "Não vinculado"} />
            <InfoItem
              label="Validade"
              value={orcamento.validade_em ? formatDate(orcamento.validade_em) : "-"}
            />
            <InfoItem
              label="Aprovado em"
              value={orcamento.aprovado_em ? formatDateTime(orcamento.aprovado_em) : "-"}
            />
            <InfoItem
              label="Atualizado em"
              value={formatDateTime(orcamento.updated_at)}
            />
          </div>
        </CardBlock>

        <CardBlock
          title="Resumo dos itens"
          description="Distribuição dos itens cadastrados neste orçamento."
        >
          <div className="space-y-3">
            {Object.entries(itensPorTipo).length === 0 ? (
              <EmptyMiniState text="Nenhum item lançado ainda." />
            ) : (
              Object.entries(itensPorTipo).map(([tipo, quantidade]) => (
                <div
                  key={tipo}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3"
                >
                  <span className="text-sm capitalize text-white/70">
                    {normalizeItemType(tipo)}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {quantidade}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardBlock>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <CardBlock
          title="Dados da proposta"
          description="Informações comerciais que alimentam a proposta em PDF."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoItem
              label="Modalidade"
              value={orcamento.modalidade_contratacao ?? "-"}
            />
            <InfoItem
              label="Prazo estimado"
              value={orcamento.prazo_estimado ?? "-"}
            />
            <InfoItem
              label="Inclui materiais"
              value={booleanLabel(orcamento.inclui_materiais)}
            />
            <InfoItem
              label="Inclui mão de obra"
              value={booleanLabel(orcamento.inclui_mao_de_obra)}
            />
            <InfoItem
              label="Inclui equipamentos"
              value={booleanLabel(orcamento.inclui_equipamentos)}
            />
            <InfoItem
              label="Modelo"
              value={orcamento.proposta_modelo?.replaceAll("_", " ") ?? "-"}
            />
          </div>

          <div className="mt-4 space-y-4">
            <TextBox
              title="Escopo resumido"
              icon={<Layers3 className="h-4 w-4" />}
              value={orcamento.escopo_resumido}
              emptyText="Escopo resumido não informado."
            />

            <TextBox
              title="Texto de apresentação"
              icon={<Building2 className="h-4 w-4" />}
              value={orcamento.texto_apresentacao}
              emptyText="Texto de apresentação não informado."
            />

            <TextBox
              title="Condições comerciais"
              icon={<FileText className="h-4 w-4" />}
              value={orcamento.condicoes_comerciais}
              emptyText="Condições comerciais não informadas."
            />

            <TextBox
              title="Garantia"
              icon={<ShieldAlert className="h-4 w-4" />}
              value={orcamento.garantia_texto}
              emptyText="Garantia não informada."
            />
          </div>
        </CardBlock>

        <CardBlock
          title="Cliente"
          description="Dados do cliente vinculados ao orçamento."
        >
          <div className="space-y-3">
            <InfoRow
              icon={<User2 className="h-4 w-4" />}
              label="Nome"
              value={cliente?.nome ?? "Não vinculado"}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Telefone"
              value={cliente?.telefone ?? "-"}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={cliente?.email ?? "-"}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Endereço"
              value={formatClientAddress(cliente)}
            />
          </div>
        </CardBlock>
      </section>

      <CardBlock
        title="Etapas da proposta"
        description="Etapas comerciais e valores previstos para apresentação ao cliente."
      >
        {etapas.length === 0 ? (
          <EmptyMiniState text="Nenhuma etapa cadastrada para este orçamento." />
        ) : (
          <div className="space-y-3">
            {etapas.map((etapa) => (
              <div
                key={etapa.id}
                className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-[#FF5017]/20 bg-[#FF5017]/10 px-3 py-1 text-xs font-medium text-[#FF8A63]">
                        Etapa {etapa.ordem}
                      </span>
                      <h3 className="text-sm font-semibold text-white sm:text-base">
                        {etapa.nome}
                      </h3>
                    </div>

                    {etapa.descricao?.trim() ? (
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        {etapa.descricao}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-right">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                      Valor da etapa
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCurrency(Number(etapa.valor_total ?? 0))}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {itensPorEtapa[etapa.id]?.length ? (
                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-0">
                          <thead>
                            <tr className="bg-white/[0.03]">
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                                Item
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                                Tipo
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                                Quantidade
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                                Total venda
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {itensPorEtapa[etapa.id].map((item) => (
                              <tr key={item.id} className="border-t border-white/5">
                                <td className="px-4 py-3 text-sm text-white">
                                  {item.descricao}
                                </td>
                                <td className="px-4 py-3 text-sm text-white/60 capitalize">
                                  {normalizeItemType(item.tipo_item)}
                                </td>
                                <td className="px-4 py-3 text-sm text-white/60">
                                  {formatDecimal(item.quantidade)}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-white">
                                  {formatCurrency(
                                    Number(
                                      item.venda_total ??
                                        Number(item.venda_unitaria ?? 0) *
                                          Number(item.quantidade ?? 0)
                                    )
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <EmptyMiniState text="Nenhum item vinculado a esta etapa." />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBlock>

      <CardBlock
        title="Itens do orçamento"
        description="Itens cadastrados com quantidade, custo e venda."
      >
        <div className="overflow-hidden rounded-[20px] border border-white/5 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Ordem
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Tipo
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Descrição
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Quantidade
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Custo unit.
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Venda unit.
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                    Total venda
                  </th>
                </tr>
              </thead>

              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-white/45"
                    >
                      Nenhum item encontrado para este orçamento.
                    </td>
                  </tr>
                ) : (
                  itens.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 text-sm text-white/60">
                        {item.ordem}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium capitalize text-white/60">
                          {normalizeItemType(item.tipo_item)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-white">
                        {item.descricao}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {formatDecimal(item.quantidade)}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {formatCurrency(Number(item.custo_unitario ?? 0))}
                      </td>
                      <td className="px-4 py-4 text-sm text-white/70">
                        {formatCurrency(Number(item.venda_unitaria ?? 0))}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {formatCurrency(
                          Number(
                            item.venda_total ??
                              Number(item.venda_unitaria ?? 0) *
                                Number(item.quantidade ?? 0)
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardBlock>

      <CardBlock
        title="Observações"
        description="Anotações gerais e condições complementares."
      >
        {orcamento.observacoes?.trim() ? (
          <div className="rounded-[20px] border border-white/5 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/65">
            {orcamento.observacoes}
          </div>
        ) : (
          <EmptyMiniState text="Nenhuma observação cadastrada para este orçamento." />
        )}
      </CardBlock>
    </div>
  );
}

function buildItemsByType(items: OrcamentoItemRow[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item.tipo_item || "outro";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function buildItemsByEtapa(
  items: OrcamentoItemRow[],
  etapas: OrcamentoEtapaRow[]
) {
  const initial = etapas.reduce<Record<string, OrcamentoItemRow[]>>((acc, etapa) => {
    acc[etapa.id] = [];
    return acc;
  }, {});

  for (const item of items) {
    if (item.etapa_id) {
      if (!initial[item.etapa_id]) {
        initial[item.etapa_id] = [];
      }
      initial[item.etapa_id].push(item);
    }
  }

  return initial;
}

function translateStatus(status: OrcamentoStatus) {
  const map: Record<OrcamentoStatus, string> = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    reprovado: "Reprovado",
    cancelado: "Cancelado",
    convertido: "Convertido",
  };

  return map[status] ?? status;
}

function normalizeItemType(tipo: string) {
  return tipo.replaceAll("_", " ");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDecimal(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function booleanLabel(value: boolean | null | undefined) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return "-";
}

function formatClientAddress(cliente: ClienteRow[number] | null) {
  if (!cliente) return "-";

  const line1 = [cliente.endereco, cliente.numero]
    .filter(Boolean)
    .join(", ");

  const line2 = [cliente.complemento, cliente.bairro]
    .filter(Boolean)
    .join(" • ");

  const line3 = [cliente.cidade, cliente.estado, cliente.cep]
    .filter(Boolean)
    .join(" - ");

  const full = [line1, line2, line3].filter(Boolean).join(" | ");
  return full || "-";
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

      <div className="relative z-10">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="text-sm text-white/50">{description}</p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  highlight = false,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              highlight ? "text-[#FF8A63]" : "text-white"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            highlight
              ? "bg-[#FF5017]/15 text-[#FF8A63]"
              : "bg-white/[0.04] text-white/70"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/75">{value}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
      <div className="mt-0.5 text-white/45">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.12em] text-white/35">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-white/75">{value}</p>
      </div>
    </div>
  );
}

function TextBox({
  title,
  icon,
  value,
  emptyText,
}: {
  title: string;
  icon: ReactNode;
  value: string | null;
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/75">
        <span className="text-white/45">{icon}</span>
        {title}
      </div>
      <p className="text-sm leading-relaxed text-white/60">
        {value?.trim() ? value : emptyText}
      </p>
    </div>
  );
}

function EmptyMiniState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
      {text}
    </div>
  );
}

function ActionButton({
  href,
  children,
  variant = "default",
  target,
  asDisabled = false,
}: {
  href?: string;
  children: ReactNode;
  variant?: "default" | "ghost" | "success" | "danger";
  target?: string;
  asDisabled?: boolean;
}) {
  const styles = {
    default:
      "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]",
    ghost:
      "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]",
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
    danger:
      "border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15",
  } as const;

  if (asDisabled) {
    return (
      <span
        className={`inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium opacity-60 ${styles[variant]}`}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      target={target}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}

function StatusBadge({ status }: { status: OrcamentoStatus }) {
  const styles: Record<
    OrcamentoStatus,
    { label: string; className: string; dot: string }
  > = {
    rascunho: {
      label: "Rascunho",
      className: "border border-white/10 bg-white/[0.05] text-white/60",
      dot: "bg-white/35",
    },
    enviado: {
      label: "Enviado",
      className: "border border-sky-500/20 bg-sky-500/10 text-sky-300",
      dot: "bg-sky-400",
    },
    aprovado: {
      label: "Aprovado",
      className:
        "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-400",
    },
    reprovado: {
      label: "Reprovado",
      className: "border border-rose-500/20 bg-rose-500/10 text-rose-300",
      dot: "bg-rose-400",
    },
    cancelado: {
      label: "Cancelado",
      className: "border border-white/10 bg-white/[0.05] text-white/55",
      dot: "bg-white/35",
    },
    convertido: {
      label: "Convertido",
      className:
        "border border-[#FF5017]/20 bg-[#FF5017]/10 text-[#FF8A63]",
      dot: "bg-[#FF8A63]",
    },
  };

  const item = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${item.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}