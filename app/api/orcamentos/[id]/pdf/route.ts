// app/api/orcamentos/[id]/pdf/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const viewport = {
  width: 1280,
  height: 1800,
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  isLandscape: false,
} as const;

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

    const logoSvgMarkup = await loadLogoSvgMarkup();

    const html = buildProposalHtml({
      orcamento,
      cliente,
      itens,
      etapas,
      valorTotal,
      responsavelNome: usuarioRow.nome ?? "Usuário",
      logoSvgMarkup,
    });

    const isLocal = process.env.NODE_ENV !== "production";

    const browser = await puppeteer.launch({
      args: isLocal
        ? puppeteer.defaultArgs()
        : puppeteer.defaultArgs({
            args: chromium.args,
            headless: "shell",
          }),
      defaultViewport: viewport,
      executablePath: isLocal
        ? process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        : await chromium.executablePath(),
      headless: isLocal ? true : "shell",
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
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

async function loadLogoSvgMarkup() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logomorais.svg");
    const rawSvg = await readFile(logoPath, "utf-8");

    return rawSvg
      .replace(/<\?xml[\s\S]*?\?>/gi, "")
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .replace(/width="[^"]*"/gi, "")
      .replace(/height="[^"]*"/gi, "")
      .replace(
        /<svg\b([^>]*)>/i,
        `<svg $1 preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
      );
  } catch {
    return `
      <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="180" height="180" rx="24" fill="#FFFFFF"/>
        <path d="M50 130V55h16l24 33 24-33h16v75h-17V84l-23 31h-1L67 84v46H50Z" fill="#0D1B2A"/>
      </svg>
    `;
  }
}

function buildProposalHtml({
  orcamento,
  cliente,
  itens,
  etapas,
  valorTotal,
  responsavelNome,
  logoSvgMarkup,
}: {
  orcamento: OrcamentoRow;
  cliente: ClienteRow[number] | null;
  itens: OrcamentoItemRow[];
  etapas: OrcamentoEtapaRow[];
  valorTotal: number;
  responsavelNome: string;
  logoSvgMarkup: string;
}) {
  const diferenciais = normalizeStringArray(orcamento.diferenciais, [
    "Obra no prazo",
    "Agilidade e qualidade",
    "Equipe própria",
    "Comunicação clara",
    "Contrato claro",
    "Garantia na execução",
  ]).slice(0, 6);

  const escopoPdf = normalizeStringArray(orcamento.escopo_pdf, []);
  const proximosPassos = normalizeStringArray(orcamento.proximos_passos, [
    "Aprovação da proposta",
    "Assinatura do contrato",
    "Entrada inicial",
    "Início das obras",
  ]).slice(0, 4);

  const clienteNome = cliente?.nome?.trim() || "Cliente não vinculado";
  const clienteTelefone = cliente?.telefone?.trim() || "Não informado";
  const clienteEmail = cliente?.email?.trim() || "Não informado";
  const clienteEndereco = formatClientAddress(cliente);

  const titulo = orcamento.titulo?.trim() || "Proposta Comercial";
  const subtitulo =
    orcamento.subtitulo?.trim() ||
    orcamento.escopo_resumido?.trim() ||
    "Execução de obra";
  const textoApresentacao =
    orcamento.texto_apresentacao?.trim() ||
    "Construindo sonhos com qualidade, transparência e compromisso com cada etapa da sua obra.";

  const modalidade =
    orcamento.modalidade_contratacao?.trim() || "Não informada";
  const prazoEstimado = orcamento.prazo_estimado?.trim() || "Não informado";
  const validadeTexto = orcamento.validade_em
    ? `Proposta válida até ${formatDate(orcamento.validade_em)}`
    : "Proposta válida por 5 dias corridos a partir da emissão";
  const garantiaTexto =
    orcamento.garantia_texto?.trim() || "Garantia de 1 ano na execução";

  const escopoLista =
    escopoPdf.length > 0
      ? escopoPdf
      : buildEscopoFallback({
          itens,
          etapas,
          orcamento,
        });

  const includesList = buildIncludesList(orcamento);

  const stats = [
    {
      icon: "🪖",
      num: "+10",
      label: "Anos de experiência no mercado",
    },
    {
      icon: "🏠",
      num: "+30",
      label: "Obras residenciais concluídas",
    },
    {
      icon: "🛡️",
      num: "100%",
      label: "Compromisso com prazo e execução",
    },
    {
      icon: "⭐",
      num: "5★",
      label: "Atendimento próximo ao cliente",
    },
  ];

  const diferencialCards = [
    {
      icon: "⏱️",
      title: "Obra no prazo",
      desc:
        diferenciais[0] ||
        "Cronograma rigoroso com marcos de acompanhamento da obra.",
    },
    {
      icon: "⚡",
      title: "Agilidade e Qualidade",
      desc:
        diferenciais[1] ||
        "Ritmo de execução com qualidade técnica e acabamento bem conduzido.",
    },
    {
      icon: "👷",
      title: "Equipe própria",
      desc:
        diferenciais[2] ||
        "Profissionais comprometidos com a execução e organização da obra.",
    },
    {
      icon: "💬",
      title: "Comunicação clara",
      desc:
        diferenciais[3] ||
        "Atualizações e alinhamentos com clareza durante as etapas da execução.",
    },
    {
      icon: "📄",
      title: "Contrato claro",
      desc:
        diferenciais[4] ||
        "Escopo, prazo e condições bem definidos para mais segurança comercial.",
    },
    {
      icon: "🛡️",
      title: "Garantia",
      desc: diferenciais[5] || garantiaTexto,
    },
  ];

  const fluxo = buildPaymentFlow(valorTotal);
  const etapasResumo = buildEtapasResumo(etapas, itens, valorTotal);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(titulo)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --navy: #0D1B2A;
      --navy2: #1B2E42;
      --navy3: #11243A;
      --gold: #C9A84C;
      --gold-lt: #E2C87A;
      --white: #FFFFFF;
      --light: #F5F7FA;
      --gray: #64748B;
      --dark: #1E293B;
      --lgray: #E2E8F0;
      --card-bg: #11243A;
      --border: #2A3F55;
      --muted: #A0B0C0;
    }

    @page {
      size: A4;
      margin: 0;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
      color: var(--dark);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-size: 12px;
      line-height: 1.45;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: auto;
    }

    .nav {
      background: rgba(13,27,42,0.98);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18mm;
      height: 14mm;
    }

    .nav-brand {
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--gold);
      text-transform: uppercase;
      font-weight: 700;
    }

    .nav-arrows {
      display: flex;
      gap: 6px;
    }

    .nav-btn {
      background: var(--border);
      color: var(--white);
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }

    .slide {
      min-height: calc(297mm - 14mm);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .slide-header {
      background: var(--navy2);
      border-top: 4px solid var(--gold);
      padding: 0 18mm;
      min-height: 16mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .slide-header h2 {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--white);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .slide-header h2::before {
      content: "";
      display: block;
      width: 4px;
      height: 18px;
      background: var(--gold);
      border-radius: 999px;
      flex-shrink: 0;
    }

    .brand-tag {
      font-size: 9px;
      color: var(--gold);
      letter-spacing: 0.08em;
      opacity: 0.9;
      text-transform: uppercase;
      font-weight: 700;
    }

    .slide-body {
      flex: 1;
      padding: 14mm 18mm;
      display: flex;
      flex-direction: column;
    }

    .slide-footer {
      background: var(--gold);
      padding: 8px 18mm;
      text-align: center;
      font-size: 9px;
      color: var(--navy);
      font-weight: 700;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }

    .slide-footer.dark {
      background: var(--navy2);
      color: #90A0B1;
      font-weight: 500;
    }

    /* CAPA */
    .cover {
      background: var(--navy);
      flex-direction: row;
      min-height: calc(297mm - 14mm);
    }

    .capa-left {
      width: 40%;
      background: var(--navy2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 18mm 12mm;
      border-right: 3px solid var(--gold);
      position: relative;
      flex-shrink: 0;
    }

    .capa-logo {
      width: 56mm;
      height: 56mm;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10mm;
    }

    .capa-logo svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .capa-brand {
      font-size: 25px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--white);
      line-height: 1;
      text-align: center;
    }

    .capa-sub {
      font-size: 11px;
      letter-spacing: 0.25em;
      color: var(--gold);
      text-transform: uppercase;
      margin-top: 4px;
      margin-bottom: 10mm;
      text-align: center;
    }

    .capa-divider {
      width: 60%;
      height: 2px;
      background: var(--gold);
      margin: 0 auto 10mm;
    }

    .capa-tagline {
      font-size: 11px;
      color: var(--muted);
      text-align: center;
      line-height: 1.7;
      max-width: 85%;
    }

    .capa-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 18mm 16mm;
    }

    .capa-label {
      font-size: 9px;
      letter-spacing: 0.3em;
      color: var(--gold);
      font-weight: 700;
      margin-bottom: 4mm;
      text-transform: uppercase;
    }

    .capa-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--white);
      line-height: 1.15;
      margin-bottom: 3mm;
    }

    .capa-scope {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 10mm;
      line-height: 1.6;
    }

    .capa-info-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .capa-card {
      background: #162030;
      border: 1px solid var(--border);
      border-left: 4px solid var(--gold);
      padding: 10px 12px;
      border-radius: 4px;
    }

    .capa-card-label {
      font-size: 8px;
      letter-spacing: 0.2em;
      color: var(--gold);
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .capa-card-value {
      font-size: 13px;
      font-weight: 700;
      color: var(--white);
      line-height: 1.4;
    }

    .capa-footer {
      background: var(--gold);
      padding: 10px 18mm;
      text-align: center;
      font-size: 9px;
      color: var(--navy);
      font-weight: 700;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }

    /* GERAIS */
    .light-bg {
      background: var(--light);
    }

    .dark-bg {
      background: var(--navy);
    }

    .sobre-grid {
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 12mm;
      flex: 1;
    }

    .sobre-text {
      background: var(--white);
      border: 1px solid var(--lgray);
      border-left: 4px solid var(--gold);
      padding: 16px;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }

    .sobre-text h3 {
      font-size: 22px;
      color: var(--dark);
      margin-bottom: 10px;
      line-height: 1.25;
    }

    .sobre-text p {
      font-size: 12px;
      color: var(--gray);
      line-height: 1.7;
      margin-bottom: 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .stat-card {
      background: var(--navy2);
      padding: 14px 10px;
      border-radius: 6px;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      min-height: 100px;
    }

    .stat-icon {
      font-size: 20px;
      margin-bottom: 6px;
      display: block;
    }

    .stat-num {
      font-size: 26px;
      font-weight: 700;
      color: var(--gold);
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 10px;
      color: var(--muted);
      line-height: 1.45;
    }

    .porque-headline {
      text-align: center;
      padding: 6px 0 16px;
    }

    .porque-headline h3 {
      font-size: 24px;
      color: var(--gold);
      margin-bottom: 6px;
      line-height: 1.25;
    }

    .porque-headline p {
      font-size: 12px;
      color: var(--muted);
    }

    .diff-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      flex: 1;
    }

    .diff-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-top: 4px solid var(--gold);
      border-radius: 6px;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
    }

    .diff-icon {
      font-size: 26px;
      line-height: 1;
      margin-bottom: 2px;
    }

    .diff-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--white);
      letter-spacing: 0.02em;
    }

    .diff-desc {
      font-size: 10px;
      color: var(--muted);
      line-height: 1.6;
    }

    .escopo-subtitle,
    .fluxo-subtitle {
      font-size: 11px;
      color: var(--gray);
      margin-bottom: 12px;
      line-height: 1.6;
    }

    .escopo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 12px;
      flex: 1;
    }

    .escopo-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 9px 10px;
      border-left: 3px solid var(--gold);
      border-bottom: 1px solid var(--lgray);
      background: var(--white);
    }

    .escopo-item:nth-child(even) {
      background: #F0F3F7;
    }

    .escopo-check {
      color: var(--gold);
      font-size: 12px;
      flex-shrink: 0;
      font-weight: 700;
      line-height: 1.3;
    }

    .escopo-text {
      font-size: 10.5px;
      color: var(--dark);
      line-height: 1.5;
    }

    .escopo-garantia {
      grid-column: 1 / -1;
      background: var(--navy2) !important;
      border-left-color: var(--gold);
      border-bottom: none;
      border-radius: 0 0 4px 4px;
      padding: 11px 12px;
      margin-top: 6px;
    }

    .escopo-garantia .escopo-check {
      font-size: 14px;
    }

    .escopo-garantia .escopo-text {
      color: var(--gold);
      font-weight: 700;
      font-size: 11px;
    }

    .invest-hero {
      background: var(--navy);
      border-radius: 8px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      gap: 18px;
    }

    .invest-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .invest-dollar {
      background: var(--gold);
      color: var(--navy);
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      flex-shrink: 0;
    }

    .invest-label {
      font-size: 8px;
      letter-spacing: 0.25em;
      color: var(--gold);
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .invest-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--white);
      line-height: 1;
    }

    .invest-right {
      text-align: right;
      font-size: 10px;
      line-height: 1.6;
    }

    .invest-right p {
      color: var(--muted);
      margin-bottom: 4px;
    }

    .invest-right .aviso {
      color: var(--gold);
      font-weight: 700;
    }

    .invest-includes-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .includes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 18px;
    }

    .include-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 11px;
      color: var(--dark);
      line-height: 1.6;
    }

    .include-icon {
      color: var(--gold);
      font-size: 11px;
      flex-shrink: 0;
      margin-top: 2px;
      font-weight: 700;
    }

    .fluxo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      flex: 1;
    }

    .fluxo-card {
      background: var(--white);
      border: 1px solid var(--lgray);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
    }

    .fluxo-header {
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .fluxo-header.entrada { background: var(--navy); }
    .fluxo-header.meio { background: #14406A; }
    .fluxo-header.conclusao { background: #1A5276; }

    .fluxo-num {
      background: var(--gold);
      color: var(--navy);
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
      flex-shrink: 0;
    }

    .fluxo-header-text h4 {
      font-size: 13px;
      font-weight: 700;
      color: var(--white);
      margin-bottom: 2px;
    }

    .fluxo-header-text span {
      font-size: 9px;
      color: var(--gold);
    }

    .fluxo-body {
      padding: 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .fluxo-pct-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .fluxo-pct {
      font-size: 26px;
      font-weight: 700;
      color: var(--gold);
      line-height: 1;
    }

    .fluxo-val {
      font-size: 13px;
      font-weight: 700;
      color: var(--dark);
    }

    .fluxo-desc {
      font-size: 10px;
      color: var(--gray);
      line-height: 1.55;
      margin-bottom: 10px;
    }

    .fluxo-items {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-top: auto;
    }

    .fluxo-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 10px;
      color: var(--dark);
      line-height: 1.45;
    }

    .fluxo-item::before {
      content: "✔";
      color: var(--gold);
      font-size: 10px;
      flex-shrink: 0;
    }

    .fluxo-total {
      background: var(--navy);
      color: var(--gold);
      text-align: center;
      padding: 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-top: 14px;
      border-radius: 6px;
    }

    .comecar-hero {
      text-align: center;
      padding: 8px 0 18px;
    }

    .comecar-hero h2 {
      font-size: 30px;
      font-weight: 700;
      color: var(--white);
      margin-bottom: 6px;
    }

    .comecar-hero p {
      font-size: 12px;
      color: var(--gold);
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      flex: 1;
    }

    .step-card {
      background: var(--navy2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
      min-height: 132px;
    }

    .step-num {
      background: var(--gold);
      color: var(--navy);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 700;
    }

    .step-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--white);
      letter-spacing: 0.02em;
      line-height: 1.35;
    }

    .step-desc {
      font-size: 10px;
      color: var(--muted);
      line-height: 1.55;
    }

    .cta-btn {
      display: inline-block;
      margin: 16px auto 0;
      background: var(--gold);
      color: var(--navy);
      border: none;
      padding: 10px 26px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border-radius: 6px;
      text-decoration: none;
    }

    .cliente-box {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 12px;
      margin-top: 10px;
    }

    .cliente-box-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 6px;
    }

    .cliente-mini {
      min-width: 180px;
    }

    .cliente-mini-label {
      font-size: 8px;
      letter-spacing: 0.16em;
      color: var(--gold);
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .cliente-mini-value {
      font-size: 10px;
      color: var(--white);
      line-height: 1.55;
    }

    .stage-summary {
      display: grid;
      gap: 10px;
      margin-top: 12px;
    }

    .stage-card {
      background: var(--white);
      border: 1px solid var(--lgray);
      border-left: 4px solid var(--gold);
      border-radius: 6px;
      padding: 12px;
    }

    .stage-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 6px;
    }

    .stage-chip {
      display: inline-block;
      font-size: 8px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
      color: #9A6D11;
      background: #FBF3D9;
      border: 1px solid #F1E1A6;
      border-radius: 999px;
      padding: 4px 8px;
      margin-bottom: 6px;
    }

    .stage-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--dark);
      line-height: 1.35;
    }

    .stage-desc {
      font-size: 10px;
      color: var(--gray);
      line-height: 1.6;
      margin-top: 4px;
    }

    .stage-value {
      font-size: 14px;
      font-weight: 700;
      color: var(--dark);
      white-space: nowrap;
    }

    .stage-items {
      margin-top: 8px;
      display: grid;
      gap: 5px;
    }

    .stage-item {
      font-size: 10px;
      color: var(--dark);
      line-height: 1.5;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .stage-item::before {
      content: "•";
      color: var(--gold);
      font-weight: 700;
      flex-shrink: 0;
    }

    .obs-box {
      margin-top: 14px;
      background: #F8FAFC;
      border: 1px solid var(--lgray);
      border-radius: 6px;
      padding: 12px;
    }

    .obs-label {
      font-size: 8px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--gray);
      font-weight: 700;
      margin-bottom: 6px;
    }

    .obs-text {
      font-size: 10px;
      color: var(--dark);
      line-height: 1.65;
      white-space: pre-wrap;
    }

    .small-muted {
      font-size: 9px;
      color: var(--gray);
      line-height: 1.6;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1 -->
  <div class="page">
    <div class="nav">
      <span class="nav-brand">Moraes Construtora</span>
      <div class="nav-arrows">
        <span class="nav-btn">←</span>
        <span class="nav-btn">→</span>
      </div>
    </div>

    <section class="slide cover">
      <div class="capa-left">
        <div class="capa-logo">${logoSvgMarkup}</div>
        <div class="capa-brand">MORAIS</div>
        <div class="capa-sub">Construtora</div>
        <div class="capa-divider"></div>
        <div class="capa-tagline">Construindo sonhos<br>com qualidade e confiança</div>
      </div>

      <div class="capa-right">
        <div class="capa-label">Proposta Comercial</div>
        <h1 class="capa-title">${escapeHtml(titulo)}</h1>
        <p class="capa-scope">${escapeHtml(subtitulo)}</p>

        <div class="capa-info-cards">
          <div class="capa-card">
            <div class="capa-card-label">Valor Total</div>
            <div class="capa-card-value">${formatCurrency(valorTotal)}</div>
          </div>

          <div class="capa-card">
            <div class="capa-card-label">Modalidade</div>
            <div class="capa-card-value">${escapeHtml(modalidade)}</div>
          </div>

          <div class="capa-card">
            <div class="capa-card-label">Prazo</div>
            <div class="capa-card-value">${escapeHtml(prazoEstimado)}</div>
          </div>
        </div>

        <div class="cliente-box">
          <div class="cliente-mini-label">Dados do cliente</div>
          <div class="cliente-box-row">
            <div class="cliente-mini">
              <div class="cliente-mini-label">Cliente</div>
              <div class="cliente-mini-value">${escapeHtml(clienteNome)}</div>
            </div>
            <div class="cliente-mini">
              <div class="cliente-mini-label">Telefone</div>
              <div class="cliente-mini-value">${escapeHtml(clienteTelefone)}</div>
            </div>
            <div class="cliente-mini">
              <div class="cliente-mini-label">Email</div>
              <div class="cliente-mini-value">${escapeHtml(clienteEmail)}</div>
            </div>
            <div class="cliente-mini" style="flex:1; min-width:100%;">
              <div class="cliente-mini-label">Endereço</div>
              <div class="cliente-mini-value">${escapeHtml(clienteEndereco)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="capa-footer">
        ${escapeHtml(validadeTexto)} • ${escapeHtml(responsavelNome)}
      </div>
    </section>
  </div>

  <!-- PÁGINA 2 -->
  <div class="page">
    <div class="nav">
      <span class="nav-brand">Moraes Construtora</span>
      <div class="nav-arrows">
        <span class="nav-btn">←</span>
        <span class="nav-btn">→</span>
      </div>
    </div>

    <section class="slide light-bg">
      <div class="slide-header">
        <h2>Sobre a Moraes Construtora</h2>
        <span class="brand-tag">Moraes Construtora</span>
      </div>

      <div class="slide-body">
        <div class="sobre-grid">
          <div class="sobre-text">
            <h3>Experiência que traz confiança!</h3>
            <p>${escapeHtml(textoApresentacao)}</p>
            <p>
              Atuamos com <strong>qualidade</strong> estrutural, cumprimento de
              <strong>prazos</strong> e relacionamento <strong>transparente</strong>
              com nossos clientes.
            </p>
            <p>
              Esta proposta foi preparada para <strong>${escapeHtml(clienteNome)}</strong>,
              com modalidade <strong>${escapeHtml(modalidade)}</strong> e prazo estimado de
              <strong>${escapeHtml(prazoEstimado)}</strong>.
            </p>
            <p class="small-muted">
              Código da proposta: ${escapeHtml(orcamento.codigo ?? "Sem código")} •
              Emissão: ${escapeHtml(formatDateTime(orcamento.created_at))}
            </p>
          </div>

          <div class="stats-grid">
            ${stats
              .map(
                (stat) => `
              <div class="stat-card">
                <span class="stat-icon">${stat.icon}</span>
                <div class="stat-num">${escapeHtml(stat.num)}</div>
                <div class="stat-label">${escapeHtml(stat.label)}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="slide-footer dark">Moraes Construtora • Proposta Comercial</div>
    </section>
  </div>

  <!-- PÁGINA 3 -->
  <div class="page">
    <div class="nav">
      <span class="nav-brand">Moraes Construtora</span>
      <div class="nav-arrows">
        <span class="nav-btn">←</span>
        <span class="nav-btn">→</span>
      </div>
    </div>

    <section class="slide dark-bg">
      <div class="slide-header">
        <h2>Por que contratar a Moraes Construtora?</h2>
        <span class="brand-tag">Moraes Construtora</span>
      </div>

      <div class="slide-body">
        <div class="porque-headline">
          <h3>Sua obra nas mãos certas. Do primeiro bloco à entrega.</h3>
          <p>Trabalhamos com responsabilidade, técnica e respeito pelo seu investimento.</p>
        </div>

        <div class="diff-grid">
          ${diferencialCards
            .map(
              (item) => `
            <div class="diff-card">
              <div class="diff-icon">${item.icon}</div>
              <div class="diff-title">${escapeHtml(item.title)}</div>
              <div class="diff-desc">${escapeHtml(item.desc)}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="slide-footer">Moraes Construtora • Qualidade que você vê e sente</div>
    </section>
  </div>

  <!-- PÁGINA 4 -->
  <div class="page">
    <div class="nav">
      <span class="nav-brand">Moraes Construtora</span>
      <div class="nav-arrows">
        <span class="nav-btn">←</span>
        <span class="nav-btn">→</span>
      </div>
    </div>

    <section class="slide light-bg">
      <div class="slide-header">
        <h2>Escopo do Serviço — O que está incluído</h2>
        <span class="brand-tag">Moraes Construtora</span>
      </div>

      <div class="slide-body">
        <p class="escopo-subtitle">
          Tudo o que está incluso na proposta comercial para esta contratação:
        </p>

        <div class="escopo-grid">
          ${escopoLista
            .map(
              (item) => `
            <div class="escopo-item">
              <span class="escopo-check">✔</span>
              <span class="escopo-text">${escapeHtml(item)}</span>
            </div>
          `
            )
            .join("")}

          <div class="escopo-item escopo-garantia">
            <span class="escopo-check">🛡️</span>
            <span class="escopo-text">${escapeHtml(garantiaTexto)}</span>
          </div>
        </div>

        ${
          orcamento.observacoes?.trim()
            ? `
          <div class="obs-box">
            <div class="obs-label">Observações</div>
            <div class="obs-text">${escapeHtml(orcamento.observacoes)}</div>
          </div>
        `
            : ""
        }
      </div>

      <div class="slide-footer dark">Moraes Construtora • Proposta Comercial</div>
    </section>
  </div>

  <!-- PÁGINA 5 -->
  <div class="page">
    <div class="nav">
      <span class="nav-brand">Moraes Construtora</span>
      <div class="nav-arrows">
        <span class="nav-btn">←</span>
        <span class="nav-btn">→</span>
      </div>
    </div>

    <section class="slide light-bg">
      <div class="slide-header">
        <h2>Investimento e Condições</h2>
        <span class="brand-tag">Moraes Construtora</span>
      </div>

      <div class="slide-body">
        <div class="invest-hero">
          <div class="invest-left">
            <div class="invest-dollar">$</div>
            <div>
              <div class="invest-label">Valor Total do Contrato</div>
              <div class="invest-value">${formatCurrency(valorTotal)}</div>
            </div>
          </div>

          <div class="invest-right">
            <p>${escapeHtml(modalidade)} • ${escapeHtml(subtitulo)}</p>
            <p class="aviso">${escapeHtml(validadeTexto)}</p>
            ${
              orcamento.condicoes_comerciais?.trim()
                ? `<p>${escapeHtml(orcamento.condicoes_comerciais)}</p>`
                : ""
            }
          </div>
        </div>

        <div class="invest-includes-title">O que está incluso no valor:</div>
        <div class="includes-grid">
          ${includesList
            .map(
              (item) => `
            <div class="include-item">
              <span class="include-icon">✔</span>
              <span>${escapeHtml(item)}</span>
            </div>
          `
            )
            .join("")}
        </div>

        ${
          etapasResumo.length > 0
            ? `
          <div class="stage-summary">
            ${etapasResumo
              .map(
                (etapa) => `
              <div class="stage-card">
                <div class="stage-top">
                  <div>
                    <div class="stage-chip">Etapa ${escapeHtml(String(etapa.ordem))}</div>
                    <div class="stage-title">${escapeHtml(etapa.nome)}</div>
                    ${
                      etapa.descricao
                        ? `<div class="stage-desc">${escapeHtml(etapa.descricao)}</div>`
                        : ""
                    }
                  </div>
                  <div class="stage-value">${formatCurrency(etapa.valorTotal)}</div>
                </div>

                ${
                  etapa.itens.length > 0
                    ? `
                  <div class="stage-items">
                    ${etapa.itens
                      .map(
                        (item) => `
                      <div class="stage-item">${escapeHtml(item)}</div>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>

      <div class="slide-footer">Proposta válida conforme condições comerciais</div>
    </section>
  </div>

  <!-- PÁGINA 6 -->
  <div class="page">
    <div class="nav">
      <span class="nav-brand">Moraes Construtora</span>
      <div class="nav-arrows">
        <span class="nav-btn">←</span>
        <span class="nav-btn">→</span>
      </div>
    </div>

    <section class="slide light-bg">
      <div class="slide-header">
        <h2>Fluxo de Desembolso</h2>
        <span class="brand-tag">Moraes Construtora</span>
      </div>

      <div class="slide-body">
        <p class="fluxo-subtitle">
          Seu investimento dividido em 3 etapas, alinhadas ao progresso real da obra:
        </p>

        <div class="fluxo-grid">
          ${fluxo
            .map(
              (item, index) => `
            <div class="fluxo-card">
              <div class="fluxo-header ${
                index === 0 ? "entrada" : index === 1 ? "meio" : "conclusao"
              }">
                <div class="fluxo-num">${String(index + 1).padStart(2, "0")}</div>
                <div class="fluxo-header-text">
                  <h4>${escapeHtml(item.titulo)}</h4>
                  <span>${escapeHtml(item.subtitulo)}</span>
                </div>
              </div>

              <div class="fluxo-body">
                <div class="fluxo-pct-row">
                  <div class="fluxo-pct">${escapeHtml(item.percentual)}</div>
                  <div class="fluxo-val">${formatCurrency(item.valor)}</div>
                </div>

                <div class="fluxo-desc">${escapeHtml(item.descricao)}</div>

                <div class="fluxo-items">
                  ${item.itens
                    .map(
                      (flowItem) => `
                    <div class="fluxo-item">${escapeHtml(flowItem)}</div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="fluxo-total">
          TOTAL: ${formatCurrency(valorTotal)} • 3 etapas • 30% + 40% + 30%
        </div>
      </div>

      <div class="slide-footer dark">Moraes Construtora • Proposta Comercial</div>
    </section>
  </div>

  <!-- PÁGINA 7 -->
  <div class="page">
    <div class="nav">
      <span class="nav-brand">Moraes Construtora</span>
      <div class="nav-arrows">
        <span class="nav-btn">←</span>
        <span class="nav-btn">→</span>
      </div>
    </div>

    <section class="slide dark-bg">
      <div class="slide-header" style="background: var(--navy2);">
        <h2>Próximos Passos</h2>
        <span class="brand-tag">Moraes Construtora</span>
      </div>

      <div class="slide-body">
        <div class="comecar-hero">
          <h2>Vamos Começar?</h2>
          <p>Próximos passos para iniciar sua obra</p>
        </div>

        <div class="steps-grid">
          ${proximosPassos
            .map((item, index) => {
              const titles = [
                "Aprovação da Proposta",
                "Assinatura do Contrato",
                "Entrada Inicial",
                "Início das Obras",
              ];

              return `
                <div class="step-card">
                  <div class="step-num">${index + 1}</div>
                  <div class="step-title">${escapeHtml(titles[index] ?? `Passo ${index + 1}`)}</div>
                  <div class="step-desc">${escapeHtml(item)}</div>
                </div>
              `;
            })
            .join("")}
        </div>

        <a href="#" class="cta-btn">Solicitar Aprovação da Proposta</a>

        <div class="obs-box" style="margin-top: 18px; background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12);">
          <div class="obs-label" style="color: var(--gold);">Resumo final</div>
          <div class="obs-text" style="color: var(--white);">
            Cliente: ${escapeHtml(clienteNome)}
            <br>Valor total: ${formatCurrency(valorTotal)}
            <br>Prazo estimado: ${escapeHtml(prazoEstimado)}
            <br>Responsável: ${escapeHtml(responsavelNome)}
          </div>
        </div>
      </div>

      <div class="slide-footer">${escapeHtml(validadeTexto)} • ${escapeHtml(clienteNome)}</div>
    </section>
  </div>

</body>
</html>
  `;
}

function buildEscopoFallback({
  itens,
  etapas,
  orcamento,
}: {
  itens: OrcamentoItemRow[];
  etapas: OrcamentoEtapaRow[];
  orcamento: OrcamentoRow;
}) {
  const itensDescricoes = itens
    .map((item) => item.descricao?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 14);

  if (itensDescricoes.length > 0) {
    return itensDescricoes;
  }

  const etapasDescricoes = etapas
    .map((etapa) => etapa.nome?.trim())
    .filter((value): value is string => Boolean(value));

  if (etapasDescricoes.length > 0) {
    return etapasDescricoes;
  }

  return [
    orcamento.escopo_resumido?.trim(),
    orcamento.descricao?.trim(),
    orcamento.modalidade_contratacao?.trim(),
  ].filter((value): value is string => Boolean(value));
}

function buildIncludesList(orcamento: OrcamentoRow) {
  const recursosInclusos = [
    orcamento.inclui_materiais ? "Materiais conforme definido em contrato/proposta" : null,
    orcamento.inclui_mao_de_obra ? "Toda a mão de obra necessária para execução dos serviços" : null,
    orcamento.inclui_equipamentos ? "Equipamentos e ferramentas necessárias para a execução" : null,
  ].filter(Boolean) as string[];

  if (recursosInclusos.length > 0) {
    return recursosInclusos;
  }

  return [
    "Execução dos serviços descritos nesta proposta comercial",
    "Acompanhamento das etapas previstas no orçamento",
    "Organização comercial e técnica da entrega",
    "Alinhamento de escopo, prazo e condições da contratação",
  ];
}

function buildPaymentFlow(valorTotal: number) {
  const entrada = roundMoney(valorTotal * 0.3);
  const meio = roundMoney(valorTotal * 0.4);
  const conclusao = roundMoney(valorTotal - entrada - meio);

  return [
    {
      titulo: "Entrada",
      subtitulo: "Assinatura do contrato",
      percentual: "30%",
      valor: entrada,
      descricao:
        "Pagamento inicial que viabiliza a mobilização da equipe e início da execução dos serviços.",
      itens: [
        "Mobilização da equipe",
        "Organização inicial da execução",
        "Preparação para início da obra",
      ],
    },
    {
      titulo: "Meio da Obra",
      subtitulo: "Avanço físico da execução",
      percentual: "40%",
      valor: meio,
      descricao:
        "Liberado conforme evolução física da obra e conclusão parcial das etapas previstas.",
      itens: [
        "Etapas intermediárias concluídas",
        "Acompanhamento da evolução física",
      ],
    },
    {
      titulo: "Conclusão",
      subtitulo: "Entrega final",
      percentual: "30%",
      valor: conclusao,
      descricao:
        "Pagamento final após entrega da etapa contratada e conferência das condições acordadas.",
      itens: [
        "Entrega final",
        "Conferência e aceite",
      ],
    },
  ];
}

function buildEtapasResumo(
  etapas: OrcamentoEtapaRow[],
  itens: OrcamentoItemRow[],
  valorTotal: number
) {
  if (etapas.length === 0) return [];

  return etapas.slice(0, 4).map((etapa) => {
    const itensDaEtapa = itens
      .filter((item) => item.etapa_id === etapa.id)
      .map((item) => item.descricao?.trim())
      .filter((value): value is string => Boolean(value))
      .slice(0, 4);

    const etapaValor = Number(etapa.valor_total ?? 0);

    return {
      ordem: etapa.ordem,
      nome: etapa.nome,
      descricao: etapa.descricao?.trim() || "",
      valorTotal: etapaValor > 0 ? etapaValor : roundMoney(valorTotal / Math.max(etapas.length, 1)),
      itens: itensDaEtapa,
    };
  });
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

        if (item && typeof item === "object" && "descricao" in item) {
          const text = (item as { descricao?: unknown }).descricao;
          return typeof text === "string" ? text.trim() : "";
        }

        return "";
      })
      .filter(Boolean);
  }

  return fallback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
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
  if (!cliente) return "Não informado";

  const line1 = [cliente.endereco, cliente.numero].filter(Boolean).join(", ");
  const line2 = [cliente.complemento, cliente.bairro].filter(Boolean).join(" • ");
  const line3 = [cliente.cidade, cliente.estado, cliente.cep]
    .filter(Boolean)
    .join(" - ");

  const full = [line1, line2, line3].filter(Boolean).join(" | ");
  return full || "Não informado";
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
