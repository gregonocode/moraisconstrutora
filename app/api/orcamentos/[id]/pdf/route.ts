// app/api/orcamentos/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: usuarioRow, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, nome")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (usuarioError) {
      return NextResponse.json(
        { error: `Erro ao buscar usuário interno: ${usuarioError.message}` },
        { status: 500 }
      );
    }

    if (!usuarioRow) {
      return NextResponse.json(
        { error: "Usuário interno não encontrado." },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: `Erro ao carregar orçamento: ${orcamentoError.message}` },
        { status: 500 }
      );
    }

    if (itensError) {
      return NextResponse.json(
        { error: `Erro ao carregar itens: ${itensError.message}` },
        { status: 500 }
      );
    }

    if (etapasError) {
      return NextResponse.json(
        { error: `Erro ao carregar etapas: ${etapasError.message}` },
        { status: 500 }
      );
    }

    if (!orcamentoData) {
      return NextResponse.json(
        { error: "Orçamento não encontrado." },
        { status: 404 }
      );
    }

    const orcamento = orcamentoData as OrcamentoRow;
    const itens = (itensData ?? []) as OrcamentoItemRow[];
    const etapas = (etapasData ?? []) as OrcamentoEtapaRow[];
    const cliente = orcamento.cliente?.[0] ?? null;

    const valorTotal = Number(orcamento.valor_total ?? 0);
    const html = buildProposalHtml({
      orcamento,
      cliente,
      itens,
      etapas,
      valorTotal,
      responsavelNome: usuarioRow.nome ?? "Usuário",
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "18mm",
          right: "12mm",
          bottom: "18mm",
          left: "12mm",
        },
      });

      const filename = sanitizeFilename(
        `${orcamento.codigo ?? "orcamento"}-${orcamento.titulo}.pdf`
      );
      const pdfBytes = Uint8Array.from(pdf);

      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao gerar PDF.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildProposalHtml({
  orcamento,
  cliente,
  itens,
  etapas,
  valorTotal,
  responsavelNome,
}: {
  orcamento: OrcamentoRow;
  cliente: ClienteRow[number] | null;
  itens: OrcamentoItemRow[];
  etapas: OrcamentoEtapaRow[];
  valorTotal: number;
  responsavelNome: string;
}) {
  const diferenciais = normalizeStringArray(orcamento.diferenciais, [
    "Planejamento e acompanhamento da execução",
    "Clareza comercial e transparência na proposta",
    "Organização por etapas e orçamento detalhado",
  ]);

  const escopoPdf = normalizeStringArray(orcamento.escopo_pdf, []);
  const proximosPassos = normalizeStringArray(orcamento.proximos_passos, [
    "Análise e aprovação da proposta",
    "Confirmação das condições comerciais",
    "Formalização e início da execução",
  ]);

  const itensSemEtapa = itens.filter((item) => !item.etapa_id);

  const etapasHtml =
    etapas.length > 0
      ? etapas
          .map((etapa) => {
            const itensDaEtapa = itens.filter((item) => item.etapa_id === etapa.id);

            return `
              <div class="etapa-card">
                <div class="etapa-top">
                  <div>
                    <div class="chip">Etapa ${escapeHtml(String(etapa.ordem))}</div>
                    <h3>${escapeHtml(etapa.nome)}</h3>
                    ${
                      etapa.descricao?.trim()
                        ? `<p class="muted">${escapeHtml(etapa.descricao)}</p>`
                        : ""
                    }
                  </div>
                  <div class="etapa-valor">
                    ${formatCurrency(Number(etapa.valor_total ?? 0))}
                  </div>
                </div>

                ${
                  itensDaEtapa.length > 0
                    ? `
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Tipo</th>
                        <th>Qtd.</th>
                        <th>Venda Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itensDaEtapa
                        .map(
                          (item) => `
                        <tr>
                          <td>${escapeHtml(item.descricao)}</td>
                          <td>${escapeHtml(normalizeItemType(item.tipo_item))}</td>
                          <td>${formatDecimal(item.quantidade)}</td>
                          <td>${formatCurrency(
                            Number(
                              item.venda_total ??
                                Number(item.venda_unitaria ?? 0) *
                                  Number(item.quantidade ?? 0)
                            )
                          )}</td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                `
                    : `<p class="muted" style="margin-top:12px;">Nenhum item vinculado a esta etapa.</p>`
                }
              </div>
            `;
          })
          .join("")
      : `
        <div class="empty-box">
          Nenhuma etapa cadastrada neste orçamento.
        </div>
      `;

  const itensResumoHtml =
    itens.length > 0
      ? `
        <table class="table">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Qtd.</th>
              <th>Venda Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itens
              .map(
                (item) => `
              <tr>
                <td>${escapeHtml(String(item.ordem))}</td>
                <td>${escapeHtml(item.descricao)}</td>
                <td>${escapeHtml(normalizeItemType(item.tipo_item))}</td>
                <td>${formatDecimal(item.quantidade)}</td>
                <td>${formatCurrency(Number(item.venda_unitaria ?? 0))}</td>
                <td>${formatCurrency(
                  Number(
                    item.venda_total ??
                      Number(item.venda_unitaria ?? 0) * Number(item.quantidade ?? 0)
                  )
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `
      : `<div class="empty-box">Nenhum item cadastrado neste orçamento.</div>`;

  const listaEscopo =
    escopoPdf.length > 0
      ? escopoPdf
      : [
          orcamento.escopo_resumido,
          orcamento.modalidade_contratacao,
          orcamento.descricao,
        ].filter((value): value is string => Boolean(value?.trim()));

  const recursosInclusos = [
    orcamento.inclui_materiais ? "Materiais" : null,
    orcamento.inclui_mao_de_obra ? "Mão de obra" : null,
    orcamento.inclui_equipamentos ? "Equipamentos" : null,
  ].filter(Boolean) as string[];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(orcamento.titulo)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2937;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
    }

    .page {
      width: 100%;
    }

    .hero {
      background: linear-gradient(135deg, #0d1b2a 0%, #11243a 100%);
      color: #fff;
      border-radius: 18px;
      overflow: hidden;
      margin-bottom: 18px;
    }

    .hero-top {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 22px;
    }

    .brand {
      max-width: 55%;
    }

    .brand-kicker {
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #e2c87a;
      margin-bottom: 8px;
      font-weight: bold;
    }

    .brand-title {
      font-size: 28px;
      font-weight: bold;
      line-height: 1.1;
      margin: 0;
    }

    .brand-subtitle {
      margin-top: 8px;
      color: #cbd5e1;
      font-size: 13px;
    }

    .hero-cards {
      min-width: 260px;
      display: grid;
      gap: 10px;
    }

    .hero-card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-left: 4px solid #c9a84c;
      border-radius: 10px;
      padding: 10px 12px;
    }

    .hero-card-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #e2c87a;
      margin-bottom: 4px;
      font-weight: bold;
    }

    .hero-card-value {
      font-size: 15px;
      font-weight: bold;
      color: #fff;
    }

    .hero-footer {
      background: #c9a84c;
      color: #0d1b2a;
      padding: 10px 22px;
      font-size: 11px;
      font-weight: bold;
    }

    .section {
      margin-bottom: 18px;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
    }

    .section-header {
      background: #0f1f30;
      color: #fff;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin: 0;
    }

    .section-body {
      padding: 16px;
      background: #fff;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .info-box {
      border: 1px solid #e5e7eb;
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px;
    }

    .info-label {
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: bold;
    }

    .info-value {
      font-size: 12px;
      color: #0f172a;
      word-break: break-word;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }

    .metric {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px;
      background: #fff;
    }

    .metric-label {
      color: #64748b;
      font-size: 11px;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 20px;
      font-weight: bold;
      color: #0f172a;
    }

    .metric-value.highlight {
      color: #c96b26;
    }

    .list {
      margin: 0;
      padding-left: 18px;
    }

    .list li {
      margin-bottom: 6px;
    }

    .etapa-card {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px;
      background: #fff;
      margin-bottom: 12px;
    }

    .etapa-top {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .etapa-top h3 {
      margin: 8px 0 4px;
      font-size: 15px;
      color: #0f172a;
    }

    .etapa-valor {
      min-width: 140px;
      text-align: right;
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
    }

    .chip {
      display: inline-block;
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 999px;
      background: #fff3eb;
      color: #c96b26;
      border: 1px solid #ffd9c1;
      font-weight: bold;
    }

    .muted {
      color: #64748b;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .table thead th {
      text-align: left;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
      background: #f8fafc;
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .table tbody td {
      padding: 10px 8px;
      border-bottom: 1px solid #eef2f7;
      vertical-align: top;
    }

    .empty-box {
      border: 1px dashed #cbd5e1;
      background: #f8fafc;
      color: #64748b;
      border-radius: 12px;
      padding: 14px;
    }

    .footer-note {
      margin-top: 16px;
      text-align: center;
      color: #64748b;
      font-size: 10px;
    }

    @media print {
      .section, .hero, .metric, .etapa-card, .info-box {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div class="hero-top">
        <div class="brand">
          <div class="brand-kicker">Proposta Comercial</div>
          <h1 class="brand-title">${escapeHtml(orcamento.titulo)}</h1>
          ${
            orcamento.subtitulo?.trim()
              ? `<div class="brand-subtitle">${escapeHtml(orcamento.subtitulo)}</div>`
              : ""
          }
          ${
            orcamento.texto_apresentacao?.trim()
              ? `<p class="brand-subtitle" style="margin-top:14px;">${escapeHtml(
                  orcamento.texto_apresentacao
                )}</p>`
              : ""
          }
        </div>

        <div class="hero-cards">
          <div class="hero-card">
            <div class="hero-card-label">Valor Total</div>
            <div class="hero-card-value">${formatCurrency(valorTotal)}</div>
          </div>
          <div class="hero-card">
            <div class="hero-card-label">Modalidade</div>
            <div class="hero-card-value">${escapeHtml(
              orcamento.modalidade_contratacao ?? "Não informada"
            )}</div>
          </div>
          <div class="hero-card">
            <div class="hero-card-label">Prazo Estimado</div>
            <div class="hero-card-value">${escapeHtml(
              orcamento.prazo_estimado ?? "Não informado"
            )}</div>
          </div>
        </div>
      </div>
      <div class="hero-footer">
        ${
          orcamento.validade_em
            ? `Proposta válida até ${escapeHtml(formatDate(orcamento.validade_em))}`
            : "Proposta comercial"
        }
        • ${escapeHtml(cliente?.nome ?? "Cliente não vinculado")}
      </div>
    </section>

    <section class="metrics">
      <div class="metric">
        <div class="metric-label">Valor Total</div>
        <div class="metric-value highlight">${formatCurrency(valorTotal)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Modalidade</div>
        <div class="metric-value">${escapeHtml(
          orcamento.modalidade_contratacao ?? "NÃ£o informada"
        )}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Prazo Estimado</div>
        <div class="metric-value">${escapeHtml(
          orcamento.prazo_estimado ?? "NÃ£o informado"
        )}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Itens</div>
        <div class="metric-value">${escapeHtml(String(itens.length))}</div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Dados da Proposta</h2>
        <span>${escapeHtml(translateStatus(orcamento.status))}</span>
      </div>
      <div class="section-body">
        <div class="grid-2">
          <div class="info-box">
            <div class="info-label">Código</div>
            <div class="info-value">${escapeHtml(orcamento.codigo ?? "Sem código")}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Modelo</div>
            <div class="info-value">${escapeHtml(
              orcamento.proposta_modelo?.replaceAll("_", " ") ?? "-"
            )}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Cliente</div>
            <div class="info-value">${escapeHtml(cliente?.nome ?? "Não vinculado")}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Emissão</div>
            <div class="info-value">${escapeHtml(formatDateTime(orcamento.created_at))}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Validade</div>
            <div class="info-value">${escapeHtml(
              orcamento.validade_em ? formatDate(orcamento.validade_em) : "-"
            )}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Responsável</div>
            <div class="info-value">${escapeHtml(responsavelNome)}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Cliente</h2>
      </div>
      <div class="section-body">
        <div class="grid-2">
          <div class="info-box">
            <div class="info-label">Nome</div>
            <div class="info-value">${escapeHtml(cliente?.nome ?? "-")}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Telefone</div>
            <div class="info-value">${escapeHtml(cliente?.telefone ?? "-")}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Email</div>
            <div class="info-value">${escapeHtml(cliente?.email ?? "-")}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Endereço</div>
            <div class="info-value">${escapeHtml(formatClientAddress(cliente))}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Escopo e Condições</h2>
      </div>
      <div class="section-body">
        ${
          orcamento.escopo_resumido?.trim()
            ? `
          <div class="info-box" style="margin-bottom:12px;">
            <div class="info-label">Escopo Resumido</div>
            <div class="info-value">${escapeHtml(orcamento.escopo_resumido)}</div>
          </div>
        `
            : ""
        }

        ${
          listaEscopo.length > 0
            ? `
          <div class="info-box" style="margin-bottom:12px;">
            <div class="info-label">Itens do Escopo</div>
            <ul class="list">
              ${listaEscopo.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        `
            : ""
        }

        <div class="grid-2">
          <div class="info-box">
            <div class="info-label">Inclui</div>
            <div class="info-value">${
              recursosInclusos.length > 0
                ? escapeHtml(recursosInclusos.join(", "))
                : "Não informado"
            }</div>
          </div>
          <div class="info-box">
            <div class="info-label">Condições Comerciais</div>
            <div class="info-value">${escapeHtml(
              orcamento.condicoes_comerciais ?? "Não informadas"
            )}</div>
          </div>
        </div>

        <div class="grid-2" style="margin-top:12px;">
          <div class="info-box">
            <div class="info-label">Garantia</div>
            <div class="info-value">${escapeHtml(
              orcamento.garantia_texto ?? "Não informada"
            )}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Observações</div>
            <div class="info-value">${escapeHtml(
              orcamento.observacoes ?? "Sem observações."
            )}</div>
          </div>
        </div>
      </div>
    </section>

    ${
      diferenciais.length > 0
        ? `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Diferenciais</h2>
        </div>
        <div class="section-body">
          <ul class="list">
            ${diferenciais.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      </section>
    `
        : ""
    }

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Etapas da Proposta</h2>
      </div>
      <div class="section-body">
        ${etapasHtml}
        ${
          itensSemEtapa.length > 0
            ? `
          <div class="etapa-card">
            <div class="chip">Itens sem etapa</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Tipo</th>
                  <th>Qtd.</th>
                  <th>Venda Total</th>
                </tr>
              </thead>
              <tbody>
                ${itensSemEtapa
                  .map(
                    (item) => `
                  <tr>
                    <td>${escapeHtml(item.descricao)}</td>
                    <td>${escapeHtml(normalizeItemType(item.tipo_item))}</td>
                    <td>${formatDecimal(item.quantidade)}</td>
                    <td>${formatCurrency(
                      Number(
                        item.venda_total ??
                          Number(item.venda_unitaria ?? 0) *
                            Number(item.quantidade ?? 0)
                      )
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : ""
        }
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">Itens do Orçamento</h2>
      </div>
      <div class="section-body">
        ${itensResumoHtml}
      </div>
    </section>

    ${
      proximosPassos.length > 0
        ? `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Próximos Passos</h2>
        </div>
        <div class="section-body">
          <ol class="list">
            ${proximosPassos.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </div>
      </section>
    `
        : ""
    }

    <div class="footer-note">
      Documento gerado automaticamente em ${escapeHtml(formatDateTime(new Date().toISOString()))}.
    </div>
  </div>
</body>
</html>
  `;
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (item && typeof item === "object" && "texto" in item) {
          const text = (item as { texto?: unknown }).texto;
          return typeof text === "string" ? text.trim() : "";
        }

        if (item && typeof item === "object" && "title" in item) {
          const text = (item as { title?: unknown }).title;
          return typeof text === "string" ? text.trim() : "";
        }

        return "";
      })
      .filter(Boolean);
  }

  return fallback;
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

function formatClientAddress(cliente: ClienteRow[number] | null) {
  if (!cliente) return "-";

  const line1 = [cliente.endereco, cliente.numero].filter(Boolean).join(", ");
  const line2 = [cliente.complemento, cliente.bairro].filter(Boolean).join(" • ");
  const line3 = [cliente.cidade, cliente.estado, cliente.cep]
    .filter(Boolean)
    .join(" - ");

  const full = [line1, line2, line3].filter(Boolean).join(" | ");
  return full || "-";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_\. ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}
