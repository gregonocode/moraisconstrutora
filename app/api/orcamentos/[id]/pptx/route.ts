// app/api/orcamentos/[id]/pptx/route.ts
import { NextResponse } from "next/server";
import pptxgen from "pptxgenjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getOrcamentoExportData,
  type OrcamentoRow,
  type OrcamentoItemRow,
  type OrcamentoEtapaRow,
  type ClienteRow,
} from "@/app/lib/orcamentos/export/get-orcamento-export-data"

const PptxGenJS = pptxgen;
const ShapeType = {
  rect: "rect",
  line: "line",
  roundRect: "roundRect",
} as const;

type PptxDocument = InstanceType<typeof pptxgen>;
type PptxSlide = ReturnType<PptxDocument["addSlide"]>;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const exportData = await getOrcamentoExportData(id);
    const {
      orcamento,
      cliente,
      itens,
      etapas,
      valorTotal,
      responsavelNome,
    } = exportData;

    const logoData = await loadLogoBuffer();

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "ChatGPT";
    pptx.company = "Moraes Construtora";
    pptx.subject = orcamento.titulo || "Proposta Comercial";
    pptx.title = orcamento.titulo || "Proposta Comercial";
    pptx.theme = {
      headFontFace: "Aptos",
      bodyFontFace: "Aptos",
    };

    const colors = {
      navy: "0D1B2A",
      navy2: "1B2E42",
      gold: "C9A84C",
      goldLt: "E2C87A",
      white: "FFFFFF",
      light: "F5F7FA",
      gray: "64748B",
      dark: "1E293B",
      lgray: "E2E8F0",
      muted: "A0B0C0",
      border: "2A3F55",
    };

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

    const includesList = buildIncludesList(orcamento);
    const escopoLista =
      escopoPdf.length > 0
        ? escopoPdf
        : buildEscopoFallback({ itens, etapas, orcamento });

    const fluxo = buildPaymentFlow(valorTotal);
    const etapasResumo = buildEtapasResumo(etapas, itens, valorTotal);

    const diferencialCards = [
      {
        icon: "01",
        title: "Obra no prazo",
        desc:
          diferenciais[0] ||
          "Cronograma rigoroso com marcos de acompanhamento da obra.",
      },
      {
        icon: "02",
        title: "Agilidade e Qualidade",
        desc:
          diferenciais[1] ||
          "Ritmo de execução com qualidade técnica e acabamento bem conduzido.",
      },
      {
        icon: "03",
        title: "Equipe própria",
        desc:
          diferenciais[2] ||
          "Profissionais comprometidos com a execução e organização da obra.",
      },
      {
        icon: "04",
        title: "Comunicação clara",
        desc:
          diferenciais[3] ||
          "Atualizações e alinhamentos com clareza durante as etapas da execução.",
      },
      {
        icon: "05",
        title: "Contrato claro",
        desc:
          diferenciais[4] ||
          "Escopo, prazo e condições bem definidos para mais segurança comercial.",
      },
      {
        icon: "06",
        title: "Garantia",
        desc: diferenciais[5] || garantiaTexto,
      },
    ];

    const stats = [
      { icon: "01", num: "+10", label: "Anos de experiência no mercado" },
      { icon: "02", num: "+30", label: "Obras residenciais concluídas" },
      { icon: "03", num: "100%", label: "Compromisso com prazo e execução" },
      { icon: "04", num: "5", label: "Atendimento próximo ao cliente" },
    ];

    // Slide 1 - Capa
    {
      const slide = pptx.addSlide();
      slide.background = { color: colors.navy };

      slide.addShape(ShapeType.rect, {
        x: 0,
        y: 0,
        w: 5.2,
        h: 7.5,
        fill: { color: colors.navy2 },
        line: { color: colors.navy2 },
      });

      slide.addShape(ShapeType.line, {
        x: 5.18,
        y: 0,
        w: 0,
        h: 7.5,
        line: { color: colors.gold, pt: 1.2 },
      });

      if (logoData) {
        slide.addImage({
          data: logoData,
          x: 1.15,
          y: 0.75,
          w: 2.8,
          h: 2.2,
          sizing: { type: "contain", x: 1.15, y: 0.75, w: 2.8, h: 2.2 },
        });
      }

      slide.addText("MORAIS", {
        x: 1.0,
        y: 3.0,
        w: 3.2,
        h: 0.35,
        fontFace: "Aptos",
        fontSize: 18,
        bold: true,
        color: colors.white,
        align: "center",
      });

      slide.addText("Construtora", {
        x: 1.0,
        y: 3.35,
        w: 3.2,
        h: 0.22,
        fontSize: 9,
        bold: false,
        color: colors.gold,
        align: "center",
        breakLine: false,
      });

      slide.addShape(ShapeType.line, {
        x: 1.45,
        y: 3.75,
        w: 2.3,
        h: 0,
        line: { color: colors.gold, pt: 1 },
      });

      slide.addText("Construindo sonhos com qualidade e confiança", {
        x: 0.9,
        y: 4.0,
        w: 3.4,
        h: 0.7,
        fontSize: 9,
        color: colors.muted,
        align: "center",
        valign: "middle",
      });

      slide.addText("Proposta Comercial", {
        x: 5.65,
        y: 1.0,
        w: 2.7,
        h: 0.22,
        fontSize: 8,
        bold: true,
        color: colors.gold,
        breakLine: false,
      });

      slide.addText(titulo, {
        x: 5.65,
        y: 1.35,
        w: 6.8,
        h: 0.9,
        fontSize: 22,
        bold: true,
        color: colors.white,
        margin: 0,
      });

      slide.addText(subtitulo, {
        x: 5.65,
        y: 2.3,
        w: 6.5,
        h: 0.55,
        fontSize: 11,
        color: colors.muted,
        margin: 0,
      });

      addInfoCard(slide, 5.65, 3.1, 3.3, 0.72, "Valor Total", formatCurrency(valorTotal), colors);
      addInfoCard(slide, 5.65, 3.95, 3.3, 0.72, "Modalidade", modalidade, colors);
      addInfoCard(slide, 5.65, 4.8, 3.3, 0.72, "Prazo", prazoEstimado, colors);

      slide.addShape(ShapeType.roundRect, {
        x: 5.65,
        y: 5.72,
        w: 6.3,
        h: 1.15,
        rectRadius: 0.08,
        fill: { color: "162030", transparency: 0 },
        line: { color: colors.border, pt: 0.5 },
      });

      slide.addText("Dados do cliente", {
        x: 5.82,
        y: 5.84,
        w: 2.0,
        h: 0.2,
        fontSize: 8,
        bold: true,
        color: colors.gold,
      });

      slide.addText(
        `Cliente: ${clienteNome}\nTelefone: ${clienteTelefone}\nEmail: ${clienteEmail}\nEndereço: ${clienteEndereco}`,
        {
          x: 5.82,
          y: 6.08,
          w: 5.8,
          h: 0.68,
          fontSize: 8.2,
          color: colors.white,
          breakLine: false,
          valign: "top",
          margin: 0,
        }
      );

      slide.addShape(ShapeType.rect, {
        x: 0,
        y: 7.1,
        w: 13.333,
        h: 0.4,
        fill: { color: colors.gold },
        line: { color: colors.gold },
      });

      slide.addText(`${validadeTexto} • ${responsavelNome}`, {
        x: 0.4,
        y: 7.2,
        w: 12.5,
        h: 0.15,
        fontSize: 7,
        bold: true,
        color: colors.navy,
        align: "center",
        margin: 0,
      });
    }

    // Slide 2 - Sobre
    {
      const slide = addStandardSlide(pptx, "Sobre a Moraes Construtora", colors, true);

      slide.addShape(ShapeType.roundRect, {
        x: 0.65,
        y: 1.1,
        w: 6.2,
        h: 4.85,
        rectRadius: 0.06,
        fill: { color: colors.white },
        line: { color: colors.lgray, pt: 0.6 },
      });

      slide.addText("Experiência que traz confiança!", {
        x: 0.92,
        y: 1.38,
        w: 4.4,
        h: 0.35,
        fontSize: 18,
        bold: true,
        color: colors.dark,
      });

      slide.addText(
        `${textoApresentacao}\n\nAtuamos com qualidade estrutural, cumprimento de prazos e relacionamento transparente com nossos clientes.\n\nEsta proposta foi preparada para ${clienteNome}, com modalidade ${modalidade} e prazo estimado de ${prazoEstimado}.\n\nCódigo da proposta: ${orcamento.codigo ?? "Sem código"} • Emissão: ${formatDateTime(orcamento.created_at)}`,
        {
          x: 0.92,
          y: 1.85,
          w: 5.55,
          h: 3.6,
          fontSize: 10.5,
          color: colors.gray,
          breakLine: false,
          margin: 0,
          valign: "top",
        }
      );

      const statPositions = [
        [7.2, 1.1],
        [10.1, 1.1],
        [7.2, 3.65],
        [10.1, 3.65],
      ] as const;

      stats.forEach((stat, i) => {
        const [x, y] = statPositions[i];
        slide.addShape(ShapeType.roundRect, {
          x,
          y,
          w: 2.2,
          h: 2.15,
          rectRadius: 0.06,
          fill: { color: colors.navy2 },
          line: { color: colors.navy2, pt: 0.5 },
        });

        slide.addShape(ShapeType.roundRect, {
          x: x + 0.72,
          y: y + 0.18,
          w: 0.76,
          h: 0.42,
          rectRadius: 0.08,
          fill: { color: colors.gold },
          line: { color: colors.gold, pt: 0 },
        });

        slide.addText(stat.icon, {
          x: x + 0.72,
          y: y + 0.24,
          w: 0.76,
          h: 0.18,
          fontSize: 11,
          bold: true,
          color: colors.navy,
          align: "center",
          valign: "middle",
          margin: 0,
        });

        slide.addText(stat.num, {
          x: x + 0.2,
          y: y + 0.78,
          w: 1.8,
          h: 0.32,
          fontSize: 20,
          bold: true,
          color: colors.gold,
          align: "center",
        });

        slide.addText(stat.label, {
          x: x + 0.18,
          y: y + 1.2,
          w: 1.85,
          h: 0.58,
          fontSize: 8.2,
          color: colors.muted,
          align: "center",
          valign: "middle",
          margin: 0,
        });
      });
    }

    // Slide 3 - Diferenciais
    {
      const slide = addStandardSlide(
        pptx,
        "Por que contratar a Moraes Construtora?",
        colors,
        false
      );

      slide.background = { color: colors.navy };

      slide.addText("Sua obra nas mãos certas. Do primeiro bloco à entrega.", {
        x: 1.0,
        y: 1.0,
        w: 11.3,
        h: 0.35,
        fontSize: 20,
        bold: true,
        color: colors.gold,
        align: "center",
      });

      slide.addText(
        "Trabalhamos com responsabilidade, técnica e respeito pelo seu investimento.",
        {
          x: 1.25,
          y: 1.42,
          w: 10.8,
          h: 0.22,
          fontSize: 10,
          color: colors.muted,
          align: "center",
        }
      );

      const positions = [
        [0.75, 2.0],
        [4.55, 2.0],
        [8.35, 2.0],
        [0.75, 4.55],
        [4.55, 4.55],
        [8.35, 4.55],
      ] as const;

      diferencialCards.forEach((item, i) => {
        const [x, y] = positions[i];
        slide.addShape(ShapeType.roundRect, {
          x,
          y,
          w: 3.1,
          h: 1.85,
          rectRadius: 0.06,
          fill: { color: "11243A" },
          line: { color: colors.border, pt: 0.5 },
        });

        slide.addShape(ShapeType.rect, {
          x,
          y,
          w: 3.1,
          h: 0.08,
          fill: { color: colors.gold },
          line: { color: colors.gold, pt: 0 },
        });

        slide.addShape(ShapeType.roundRect, {
          x: x + 1.08,
          y: y + 0.14,
          w: 0.9,
          h: 0.42,
          rectRadius: 0.08,
          fill: { color: colors.gold },
          line: { color: colors.gold, pt: 0 },
        });

        slide.addText(item.icon, {
          x: x + 1.08,
          y: y + 0.21,
          w: 0.9,
          h: 0.18,
          fontSize: 11,
          bold: true,
          color: colors.navy,
          align: "center",
          valign: "middle",
          margin: 0,
        });

        slide.addText(item.title, {
          x: x + 0.22,
          y: y + 0.63,
          w: 2.65,
          h: 0.25,
          fontSize: 10.5,
          bold: true,
          color: colors.white,
          align: "center",
        });

        slide.addText(item.desc, {
          x: x + 0.18,
          y: y + 0.96,
          w: 2.75,
          h: 0.65,
          fontSize: 7.9,
          color: colors.muted,
          align: "center",
          valign: "middle",
          margin: 0.03,
        });
      });
    }

    // Slide 4 - Escopo
    {
      const slide = addStandardSlide(
        pptx,
        "Escopo do Serviço — O que está incluído",
        colors,
        true
      );

      slide.addText(
        "Tudo o que está incluso na proposta comercial para esta contratação:",
        {
          x: 0.8,
          y: 1.0,
          w: 8.0,
          h: 0.25,
          fontSize: 10,
          color: colors.gray,
        }
      );

      const col1 = escopoLista.slice(0, Math.ceil(escopoLista.length / 2));
      const col2 = escopoLista.slice(Math.ceil(escopoLista.length / 2));

      addEscopoColumn(slide, col1, 0.75, 1.4, colors);
      addEscopoColumn(slide, col2, 6.7, 1.4, colors);

      slide.addShape(ShapeType.roundRect, {
        x: 0.75,
        y: 5.75,
        w: 11.85,
        h: 0.55,
        rectRadius: 0.04,
        fill: { color: colors.navy2 },
        line: { color: colors.navy2, pt: 0.5 },
      });

      slide.addText(`✔ ${garantiaTexto}`, {
        x: 0.98,
        y: 5.93,
        w: 11.2,
        h: 0.15,
        fontSize: 9,
        bold: true,
        color: colors.gold,
        margin: 0,
      });

      if (orcamento.observacoes?.trim()) {
        slide.addShape(ShapeType.roundRect, {
          x: 0.75,
          y: 6.45,
          w: 11.85,
          h: 0.6,
          rectRadius: 0.04,
          fill: { color: "F8FAFC" },
          line: { color: colors.lgray, pt: 0.5 },
        });

        slide.addText(`Observações\n${orcamento.observacoes}`, {
          x: 0.95,
          y: 6.58,
          w: 11.35,
          h: 0.35,
          fontSize: 8,
          color: colors.dark,
          margin: 0,
        });
      }
    }

    // Slide 5 - Investimento
    {
      const slide = addStandardSlide(
        pptx,
        "Investimento e Condições",
        colors,
        true
      );

      slide.addShape(ShapeType.roundRect, {
        x: 0.7,
        y: 1.0,
        w: 11.95,
        h: 1.15,
        rectRadius: 0.08,
        fill: { color: colors.navy },
        line: { color: colors.navy, pt: 0.5 },
      });

      slide.addShape(ShapeType.roundRect, {
        x: 0.88,
        y: 1.23,
        w: 0.54,
        h: 0.42,
        rectRadius: 0.08,
        fill: { color: colors.gold },
        line: { color: colors.gold, pt: 0 },
      });

      slide.addText("$", {
        x: 0.92,
        y: 1.34,
        w: 0.45,
        h: 0.18,
        fontSize: 18,
        bold: true,
        color: colors.navy,
        align: "center",
        valign: "middle",
        margin: 0,
      });

      slide.addText("Valor Total do Contrato", {
        x: 1.55,
        y: 1.18,
        w: 2.6,
        h: 0.18,
        fontSize: 7.5,
        bold: true,
        color: colors.gold,
      });

      slide.addText(formatCurrency(valorTotal), {
        x: 1.55,
        y: 1.42,
        w: 3.4,
        h: 0.32,
        fontSize: 24,
        bold: true,
        color: colors.white,
      });

      slide.addText(
        `${modalidade} • ${subtitulo}\n${validadeTexto}${
          orcamento.condicoes_comerciais?.trim()
            ? `\n${orcamento.condicoes_comerciais}`
            : ""
        }`,
        {
          x: 7.3,
          y: 1.18,
          w: 4.8,
          h: 0.58,
          fontSize: 8.2,
          color: colors.muted,
          align: "right",
          margin: 0,
        }
      );

      slide.addText("O que está incluso no valor:", {
        x: 0.75,
        y: 2.55,
        w: 4.0,
        h: 0.22,
        fontSize: 10,
        bold: true,
        color: colors.dark,
      });

      addBulletColumn(slide, includesList.slice(0, 4), 0.85, 2.9, 5.4, colors);
      addBulletColumn(slide, includesList.slice(4), 6.7, 2.9, 5.4, colors);

      if (etapasResumo.length > 0) {
        let currentY = 4.25;
        etapasResumo.slice(0, 3).forEach((etapa) => {
          slide.addShape(ShapeType.roundRect, {
            x: 0.75,
            y: currentY,
            w: 11.85,
            h: 0.78,
            rectRadius: 0.04,
            fill: { color: colors.white },
            line: { color: colors.lgray, pt: 0.5 },
          });

          slide.addText(`Etapa ${etapa.ordem}`, {
            x: 0.95,
            y: currentY + 0.08,
            w: 0.95,
            h: 0.14,
            fontSize: 6.8,
            bold: true,
            color: "9A6D11",
            fill: { color: "FBF3D9" },
            margin: 0.03,
            align: "center",
          });

          slide.addText(etapa.nome, {
            x: 0.95,
            y: currentY + 0.25,
            w: 7.9,
            h: 0.16,
            fontSize: 10,
            bold: true,
            color: colors.dark,
          });

          if (etapa.descricao) {
            slide.addText(etapa.descricao, {
              x: 0.95,
              y: currentY + 0.43,
              w: 7.9,
              h: 0.14,
              fontSize: 7.2,
              color: colors.gray,
              margin: 0,
            });
          }

          slide.addText(formatCurrency(etapa.valorTotal), {
            x: 9.8,
            y: currentY + 0.25,
            w: 2.3,
            h: 0.16,
            fontSize: 10,
            bold: true,
            color: colors.dark,
            align: "right",
          });

          currentY += 0.92;
        });
      }
    }

    // Slide 6 - Fluxo
    {
      const slide = addStandardSlide(
        pptx,
        "Fluxo de Desembolso",
        colors,
        true
      );

      slide.addText(
        "Seu investimento dividido em 3 etapas, alinhadas ao progresso real da obra:",
        {
          x: 0.8,
          y: 1.0,
          w: 8.5,
          h: 0.25,
          fontSize: 10,
          color: colors.gray,
        }
      );

      const xs = [0.7, 4.45, 8.2];
      fluxo.forEach((item, i) => {
        const headerColor =
          i === 0 ? colors.navy : i === 1 ? "14406A" : "1A5276";

        slide.addShape(ShapeType.roundRect, {
          x: xs[i],
          y: 1.45,
          w: 3.15,
          h: 4.45,
          rectRadius: 0.05,
          fill: { color: colors.white },
          line: { color: colors.lgray, pt: 0.5 },
        });

        slide.addShape(ShapeType.rect, {
          x: xs[i],
          y: 1.45,
          w: 3.15,
          h: 0.72,
          fill: { color: headerColor },
          line: { color: headerColor, pt: 0 },
        });

        slide.addShape(ShapeType.roundRect, {
          x: xs[i] + 0.12,
          y: 1.58,
          w: 0.56,
          h: 0.42,
          rectRadius: 0.08,
          fill: { color: colors.gold },
          line: { color: colors.gold, pt: 0 },
        });

        slide.addText(String(i + 1).padStart(2, "0"), {
          x: xs[i] + 0.18,
          y: 1.72,
          w: 0.45,
          h: 0.14,
          fontSize: 10,
          bold: true,
          color: colors.navy,
          align: "center",
          valign: "middle",
          margin: 0,
        });

        slide.addText(item.titulo, {
          x: xs[i] + 0.78,
          y: 1.62,
          w: 1.6,
          h: 0.14,
          fontSize: 9.5,
          bold: true,
          color: colors.white,
        });

        slide.addText(item.subtitulo, {
          x: xs[i] + 0.78,
          y: 1.82,
          w: 1.8,
          h: 0.12,
          fontSize: 6.8,
          color: colors.gold,
        });

        slide.addText(item.percentual, {
          x: xs[i] + 0.18,
          y: 2.4,
          w: 1.15,
          h: 0.3,
          fontSize: 22,
          bold: true,
          color: colors.gold,
        });

        slide.addText(formatCurrency(item.valor), {
          x: xs[i] + 1.4,
          y: 2.52,
          w: 1.4,
          h: 0.14,
          fontSize: 9.5,
          bold: true,
          color: colors.dark,
        });

        slide.addText(item.descricao, {
          x: xs[i] + 0.18,
          y: 2.95,
          w: 2.75,
          h: 0.65,
          fontSize: 7.5,
          color: colors.gray,
          margin: 0,
        });

        let itemY = 3.85;
        item.itens.forEach((flowItem) => {
          slide.addText(`✔ ${flowItem}`, {
            x: xs[i] + 0.18,
            y: itemY,
            w: 2.7,
            h: 0.14,
            fontSize: 7.5,
            color: colors.dark,
            margin: 0,
          });
          itemY += 0.22;
        });
      });

      slide.addShape(ShapeType.roundRect, {
        x: 2.6,
        y: 6.25,
        w: 8.1,
        h: 0.45,
        rectRadius: 0.04,
        fill: { color: colors.navy },
        line: { color: colors.navy, pt: 0.5 },
      });

      slide.addText(
        `TOTAL: ${formatCurrency(valorTotal)} • 3 etapas • 30% + 40% + 30%`,
        {
          x: 2.75,
          y: 6.39,
          w: 7.8,
          h: 0.14,
          fontSize: 9,
          bold: true,
          color: colors.gold,
          align: "center",
        }
      );
    }

    // Slide 7 - Próximos passos
    {
      const slide = addStandardSlide(
        pptx,
        "Próximos Passos",
        colors,
        false
      );
      slide.background = { color: colors.navy };

      slide.addText("Vamos Começar?", {
        x: 4.2,
        y: 0.95,
        w: 4.9,
        h: 0.35,
        fontSize: 24,
        bold: true,
        color: colors.white,
        align: "center",
      });

      slide.addText("Próximos passos para iniciar sua obra", {
        x: 3.7,
        y: 1.35,
        w: 5.9,
        h: 0.18,
        fontSize: 10,
        color: colors.gold,
        align: "center",
      });

      const titles = [
        "Aprovação da Proposta",
        "Assinatura do Contrato",
        "Entrada Inicial",
        "Início das Obras",
      ];

      const stepXs = [0.7, 3.9, 7.1, 10.3];
      proximosPassos.slice(0, 4).forEach((item, i) => {
        slide.addShape(ShapeType.roundRect, {
          x: stepXs[i],
          y: 2.05,
          w: 2.35,
          h: 2.15,
          rectRadius: 0.05,
          fill: { color: colors.navy2 },
          line: { color: colors.border, pt: 0.5 },
        });

        slide.addShape(ShapeType.roundRect, {
          x: stepXs[i] + 0.84,
          y: 2.18,
          w: 0.66,
          h: 0.42,
          rectRadius: 0.16,
          fill: { color: colors.gold },
          line: { color: colors.gold, pt: 0 },
        });

        slide.addText(String(i + 1), {
          x: stepXs[i] + 0.84,
          y: 2.25,
          w: 0.66,
          h: 0.18,
          fontSize: 13,
          bold: true,
          color: colors.navy,
          align: "center",
          valign: "middle",
          margin: 0,
        });

        slide.addText(titles[i] ?? `Passo ${i + 1}`, {
          x: stepXs[i] + 0.15,
          y: 2.75,
          w: 2.05,
          h: 0.34,
          fontSize: 8.8,
          bold: true,
          color: colors.white,
          align: "center",
          valign: "middle",
          margin: 0,
        });

        slide.addText(item, {
          x: stepXs[i] + 0.12,
          y: 3.18,
          w: 2.1,
          h: 0.62,
          fontSize: 7.4,
          color: colors.muted,
          align: "center",
          valign: "middle",
          margin: 0.03,
        });
      });

      slide.addShape(ShapeType.roundRect, {
        x: 4.25,
        y: 4.65,
        w: 4.85,
        h: 0.48,
        rectRadius: 0.05,
        fill: { color: colors.gold },
        line: { color: colors.gold, pt: 0.5 },
      });

      slide.addText("Solicitar Aprovação da Proposta", {
        x: 4.4,
        y: 4.82,
        w: 4.55,
        h: 0.14,
        fontSize: 9,
        bold: true,
        color: colors.navy,
        align: "center",
      });

      slide.addShape(ShapeType.roundRect, {
        x: 2.55,
        y: 5.55,
        w: 8.25,
        h: 1.0,
        rectRadius: 0.05,
        fill: { color: colors.navy2 },
        line: { color: colors.border, pt: 0.5 },
      });

      slide.addText(
        `Resumo final\nCliente: ${clienteNome}\nValor total: ${formatCurrency(valorTotal)}\nPrazo estimado: ${prazoEstimado}\nResponsável: ${responsavelNome}`,
        {
          x: 2.8,
          y: 5.72,
          w: 7.7,
          h: 0.62,
          fontSize: 8,
          color: colors.white,
          margin: 0,
        }
      );
    }

    const buffer = (await pptx.write({
      outputType: "nodebuffer",
    })) as Buffer;

    const responseBody = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    const filename = sanitizeFilename(
      `${orcamento.codigo ?? "orcamento"}-${orcamento.titulo}.pptx`
    );

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao gerar PPTX.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function loadLogoBuffer() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logomorais.svg");
    const rawSvg = await readFile(logoPath);
    return `data:image/svg+xml;base64,${rawSvg.toString("base64")}`;
  } catch {
    return "";
  }
}

function addStandardSlide(
  pptx: PptxDocument,
  title: string,
  colors: Record<string, string>,
  lightBackground: boolean
) {
  const slide = pptx.addSlide();
  slide.background = { color: lightBackground ? colors.light : colors.navy };

  slide.addShape(ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.52,
    fill: { color: "0D1B2AF7" },
    line: { color: "0D1B2AF7", pt: 0 },
  });

  slide.addText("Moraes Construtora", {
    x: 0.72,
    y: 0.17,
    w: 2.2,
    h: 0.12,
    fontSize: 7.5,
    bold: true,
    color: colors.gold,
    breakLine: false,
  });

  slide.addShape(ShapeType.rect, {
    x: 0,
    y: 0.52,
    w: 13.333,
    h: 0.62,
    fill: { color: colors.navy2 },
    line: { color: colors.navy2, pt: 0 },
  });

  slide.addShape(ShapeType.rect, {
    x: 0,
    y: 0.52,
    w: 13.333,
    h: 0.04,
    fill: { color: colors.gold },
    line: { color: colors.gold, pt: 0 },
  });

  slide.addText(title, {
    x: 0.95,
    y: 0.72,
    w: 5.5,
    h: 0.18,
    fontSize: 9.5,
    bold: true,
    color: colors.white,
    breakLine: false,
  });

  slide.addText("Moraes Construtora", {
    x: 10.6,
    y: 0.74,
    w: 2.0,
    h: 0.12,
    fontSize: 7,
    bold: true,
    color: colors.gold,
    align: "right",
  });

  slide.addShape(ShapeType.rect, {
    x: 0,
    y: 7.2,
    w: 13.333,
    h: 0.3,
    fill: { color: lightBackground ? colors.navy2 : colors.gold },
    line: { color: lightBackground ? colors.navy2 : colors.gold, pt: 0 },
  });

  slide.addText(
    lightBackground
      ? "Moraes Construtora • Proposta Comercial"
      : "Moraes Construtora • Qualidade que você vê e sente",
    {
      x: 3.8,
      y: 7.31,
      w: 5.8,
      h: 0.1,
      fontSize: 6.6,
      color: lightBackground ? "90A0B1" : colors.navy,
      bold: !lightBackground,
      align: "center",
      margin: 0,
    }
  );

  return slide;
}

function addInfoCard(
  slide: PptxSlide,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  colors: Record<string, string>
) {
  slide.addShape(ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.04,
    fill: { color: "162030" },
    line: { color: colors.border, pt: 0.5 },
  });

  slide.addShape(ShapeType.rect, {
    x,
    y,
    w: 0.05,
    h,
    fill: { color: colors.gold },
    line: { color: colors.gold, pt: 0 },
  });

  slide.addText(label, {
    x: x + 0.16,
    y: y + 0.1,
    w: w - 0.25,
    h: 0.11,
    fontSize: 6.5,
    bold: true,
    color: colors.gold,
    breakLine: false,
  });

  slide.addText(value, {
    x: x + 0.16,
    y: y + 0.28,
    w: w - 0.25,
    h: 0.22,
    fontSize: 10,
    bold: true,
    color: colors.white,
    margin: 0,
  });
}

function addEscopoColumn(
  slide: PptxSlide,
  items: string[],
  x: number,
  startY: number,
  colors: Record<string, string>
) {
  let y = startY;

  items.forEach((item) => {
    slide.addShape(ShapeType.rect, {
      x,
      y,
      w: 5.55,
      h: 0.38,
      fill: { color: "FFFFFF" },
      line: { color: colors.lgray, pt: 0.5 },
    });

    slide.addShape(ShapeType.rect, {
      x,
      y,
      w: 0.05,
      h: 0.38,
      fill: { color: colors.gold },
      line: { color: colors.gold, pt: 0 },
    });

    slide.addText("✔", {
      x: x + 0.1,
      y: y + 0.1,
      w: 0.15,
      h: 0.12,
      fontSize: 8,
      bold: true,
      color: colors.gold,
      margin: 0,
    });

    slide.addText(item, {
      x: x + 0.3,
      y: y + 0.09,
      w: 5.05,
      h: 0.16,
      fontSize: 7.8,
      color: colors.dark,
      margin: 0,
    });

    y += 0.42;
  });
}

function addBulletColumn(
  slide: PptxSlide,
  items: string[],
  x: number,
  startY: number,
  width: number,
  colors: Record<string, string>
) {
  let y = startY;

  items.forEach((item) => {
    slide.addText(`✔ ${item}`, {
      x,
      y,
      w: width,
      h: 0.16,
      fontSize: 8.5,
      color: colors.dark,
      margin: 0,
    });
    y += 0.28;
  });
}

function buildEscopoFallback({
  itens,
  etapas,
  orcamento,
}: {
  itens: Array<{ descricao: string }>;
  etapas: Array<{ nome: string }>;
  orcamento: OrcamentoRow;
}) {
  const itensDescricoes = itens
    .map((item) => item.descricao?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 14);

  if (itensDescricoes.length > 0) return itensDescricoes;

  const etapasDescricoes = etapas
    .map((etapa) => etapa.nome?.trim())
    .filter((value): value is string => Boolean(value));

  if (etapasDescricoes.length > 0) return etapasDescricoes;

  return [
    orcamento.escopo_resumido?.trim(),
    orcamento.descricao?.trim(),
    orcamento.modalidade_contratacao?.trim(),
  ].filter((value): value is string => Boolean(value));
}

function buildIncludesList(orcamento: OrcamentoRow) {
  const recursosInclusos = [
    orcamento.inclui_materiais
      ? "Materiais conforme definido em contrato/proposta"
      : null,
    orcamento.inclui_mao_de_obra
      ? "Toda a mão de obra necessária para execução dos serviços"
      : null,
    orcamento.inclui_equipamentos
      ? "Equipamentos e ferramentas necessárias para a execução"
      : null,
  ].filter(Boolean) as string[];

  if (recursosInclusos.length > 0) return recursosInclusos;

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
      itens: ["Entrega final", "Conferência e aceite"],
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
      valorTotal:
        etapaValor > 0
          ? etapaValor
          : roundMoney(valorTotal / Math.max(etapas.length, 1)),
      itens: itensDaEtapa,
    };
  });
}

function normalizeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

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
  const line2 = [cliente.complemento, cliente.bairro]
    .filter(Boolean)
    .join(" • ");
  const line3 = [cliente.cidade, cliente.estado, cliente.cep]
    .filter(Boolean)
    .join(" - ");

  const full = [line1, line2, line3].filter(Boolean).join(" | ");
  return full || "Não informado";
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_\. ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}
