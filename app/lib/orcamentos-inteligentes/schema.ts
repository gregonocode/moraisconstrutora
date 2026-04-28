import { z } from "zod";

/**
 * ============================================================================
 * ENUMS E HELPERS
 * ============================================================================
 */

export const propostaModeloSchema = z.enum([
  "comercial_padrao",
  "comercial_premium",
  "comparativo_opcoes",
  "pagamento_semanal",
]);

export const modalidadeContratacaoSchema = z.enum([
  "mao_de_obra",
  "mao_de_obra_e_equipamentos",
  "completo_inclui_materiais",
  "a_definir",
]);

export const tipoItemSchema = z.enum([
  "material",
  "servico",
  "composicao",
  "equipamento",
  "outro",
]);

export const outputFormatSchema = z.enum(["json", "pdf", "pptx"]);

function parseJsonSafe<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * ============================================================================
 * ENTRADA DO FORMULÁRIO — O QUE O USUÁRIO PREENCHE
 * ============================================================================
 */

export const intelligentBudgetInputSchema = z.object({
  userId: z.string().uuid(),
  empresaId: z.string().uuid().nullable().optional(),

  clienteId: z.string().uuid().nullable().optional(),
  clienteNomeLivre: z.string().trim().min(1).max(180).nullable().optional(),

  tituloBase: z.string().trim().min(3).max(220),
  tipoObra: z.string().trim().min(2).max(120),
  descricaoSolicitacao: z.string().trim().min(10).max(8000),

  cidade: z.string().trim().max(120).nullable().optional(),
  estado: z.string().trim().max(80).nullable().optional(),
  localObra: z.string().trim().max(220).nullable().optional(),

  modalidadeDesejada: modalidadeContratacaoSchema
    .nullable()
    .optional()
    .default("a_definir"),

  prazoDesejadoTexto: z.string().trim().max(120).nullable().optional(),
  prazoDiasDesejado: z.number().int().positive().nullable().optional(),

  valorAlvo: z.number().nonnegative().nullable().optional(),

  incluirMateriais: z.boolean().default(false),
  incluirMaoDeObra: z.boolean().default(true),
  incluirEquipamentos: z.boolean().default(false),

  gerarItensTecnicos: z.boolean().default(true),
  tentarVincularComposicoes: z.boolean().default(false),

  propostaModeloPreferido: propostaModeloSchema
    .default("comercial_padrao"),

  observacoesUsuario: z.string().trim().max(5000).nullable().optional(),
  promptBaseReferencia: z.string().trim().max(30000).nullable().optional(),

  outputFormats: z.array(outputFormatSchema).default(["json"]),
});

export type IntelligentBudgetInput = z.infer<
  typeof intelligentBudgetInputSchema
>;

/**
 * ============================================================================
 * CONTEXTO TÉCNICO ENVIADO PARA A IA
 * ============================================================================
 */

export const compositionContextItemSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string().nullable().optional(),
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  unidadeMedidaNome: z.string().nullable().optional(),
  custoTotal: z.number().nonnegative(),
});

export const resourceContextItemSchema = z.object({
  id: z.string().uuid(),
  tipo: tipoItemSchema,
  codigo: z.string().nullable().optional(),
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  unidadeMedidaNome: z.string().nullable().optional(),
  preco: z.number().nonnegative().nullable().optional(),
});

export const intelligentBudgetContextSchema = z.object({
  composicoesDisponiveis: z.array(compositionContextItemSchema).default([]),
  recursosDisponiveis: z.array(resourceContextItemSchema).default([]),
});

export type IntelligentBudgetContext = z.infer<
  typeof intelligentBudgetContextSchema
>;

/**
 * ============================================================================
 * SAÍDA DA IA — BLOCO COMERCIAL
 * ============================================================================
 */

export const aiDifferentialSchema = z.object({
  titulo: z.string().trim().min(2).max(120),
  descricao: z.string().trim().min(3).max(500),
});

export const aiEscopoItemSchema = z.object({
  texto: z.string().trim().min(2).max(500),
});

export const aiNextStepSchema = z.object({
  titulo: z.string().trim().min(2).max(120),
  descricao: z.string().trim().min(3).max(400).nullable().optional(),
});

export const aiPaymentStageSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().min(3).max(600).nullable().optional(),
  ordem: z.number().int().positive(),
  percentual: z.number().min(0).max(100).nullable().optional(),
  valorTotal: z.number().nonnegative().nullable().optional(),
  marcos: z.array(z.string().trim().min(2).max(240)).default([]),
});

export const aiBudgetItemSchema = z.object({
  tipoItem: tipoItemSchema,
  descricao: z.string().trim().min(2).max(500),
  quantidade: z.number().positive(),
  unidadeSigla: z.string().trim().max(40).nullable().optional(),

  custoUnitario: z.number().nonnegative().nullable().optional(),
  vendaUnitaria: z.number().nonnegative().nullable().optional(),

  etapaOrdemRef: z.number().int().positive().nullable().optional(),

  composicaoSugeridaNome: z.string().trim().max(180).nullable().optional(),
  composicaoSugeridaCodigo: z.string().trim().max(80).nullable().optional(),

  observacao: z.string().trim().max(500).nullable().optional(),
});

export const aiOptionSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().min(3).max(600),
  valorTotal: z.number().nonnegative(),
  diferenciais: z.array(z.string().trim().min(2).max(240)).default([]),
  pontosAtencao: z.array(z.string().trim().min(2).max(240)).default([]),
});

export const aiBudgetOutputSchema = z.object({
  titulo: z.string().trim().min(3).max(220),
  subtitulo: z.string().trim().max(220).nullable().optional(),
  descricao: z.string().trim().max(5000).nullable().optional(),

  modalidadeContratacao: modalidadeContratacaoSchema.default("a_definir"),
  prazoEstimado: z.string().trim().max(120).nullable().optional(),
  escopoResumido: z.string().trim().max(5000).nullable().optional(),

  incluiMateriais: z.boolean().default(false),
  incluiMaoDeObra: z.boolean().default(true),
  incluiEquipamentos: z.boolean().default(false),

  textoApresentacao: z.string().trim().max(5000).nullable().optional(),
  condicoesComerciais: z.string().trim().max(5000).nullable().optional(),
  garantiaTexto: z.string().trim().max(2000).nullable().optional(),

  propostaModelo: propostaModeloSchema.default("comercial_padrao"),

  valorTotal: z.number().nonnegative(),
  custoTotal: z.number().nonnegative().nullable().optional(),
  margemLucroPercentual: z.number().min(0).max(100).nullable().optional(),

  validadeDias: z.number().int().positive().default(5),

  diferenciais: z.array(aiDifferentialSchema).default([]),
  escopoPdf: z.array(aiEscopoItemSchema).default([]),
  proximosPassos: z.array(aiNextStepSchema).default([]),

  etapas: z.array(aiPaymentStageSchema).min(1),
  itens: z.array(aiBudgetItemSchema).default([]),

  opcoes: z.array(aiOptionSchema).default([]),

  observacoesGerais: z.string().trim().max(4000).nullable().optional(),

  /**
   * Campo útil para debug/auditoria da IA.
   * Não precisa ir para o banco obrigatoriamente.
   */
  rationaleResumo: z.string().trim().max(3000).nullable().optional(),
});

export type AIBudgetOutput = z.infer<typeof aiBudgetOutputSchema>;

/**
 * ============================================================================
 * FORMATO NORMALIZADO PARA O SISTEMA
 * ============================================================================
 */

export const normalizedBudgetStageSchema = z.object({
  nome: z.string(),
  descricao: z.string().nullable().optional(),
  ordem: z.number().int().positive(),
  percentual: z.number().min(0).max(100).nullable().optional(),
  valorTotal: z.number().nonnegative(),
  marcos: z.array(z.string()).default([]),
});

export const normalizedBudgetItemSchema = z.object({
  tipoItem: tipoItemSchema,
  descricao: z.string(),
  quantidade: z.number().positive(),
  unidadeSigla: z.string().nullable().optional(),

  custoUnitario: z.number().nonnegative(),
  vendaUnitaria: z.number().nonnegative(),

  custoTotal: z.number().nonnegative(),
  vendaTotal: z.number().nonnegative(),

  etapaOrdemRef: z.number().int().positive().nullable().optional(),

  composicaoSugeridaNome: z.string().nullable().optional(),
  composicaoSugeridaCodigo: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

export const normalizedBudgetDraftSchema = z.object({
  titulo: z.string(),
  subtitulo: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),

  modalidadeContratacao: modalidadeContratacaoSchema,
  prazoEstimado: z.string().nullable().optional(),
  escopoResumido: z.string().nullable().optional(),

  incluiMateriais: z.boolean(),
  incluiMaoDeObra: z.boolean(),
  incluiEquipamentos: z.boolean(),

  textoApresentacao: z.string().nullable().optional(),
  condicoesComerciais: z.string().nullable().optional(),
  garantiaTexto: z.string().nullable().optional(),

  propostaModelo: propostaModeloSchema,

  valorTotal: z.number().nonnegative(),
  custoTotal: z.number().nonnegative(),
  margemLucroPercentual: z.number().min(0).max(100),

  validadeDias: z.number().int().positive(),

  diferenciais: z.array(aiDifferentialSchema).default([]),
  escopoPdf: z.array(aiEscopoItemSchema).default([]),
  proximosPassos: z.array(aiNextStepSchema).default([]),

  etapas: z.array(normalizedBudgetStageSchema).default([]),
  itens: z.array(normalizedBudgetItemSchema).default([]),

  opcoes: z.array(aiOptionSchema).default([]),

  observacoesGerais: z.string().nullable().optional(),
  rationaleResumo: z.string().nullable().optional(),
});

export type NormalizedBudgetDraft = z.infer<
  typeof normalizedBudgetDraftSchema
>;

/**
 * ============================================================================
 * HELPERS DE NORMALIZAÇÃO
 * ============================================================================
 */

export function normalizeAiBudgetOutput(
  raw: unknown
): NormalizedBudgetDraft {
  const parsed = aiBudgetOutputSchema.parse(raw);

  const normalizedItems = parsed.itens.map((item) => {
    const quantidade = safeNumber(item.quantidade, 0);
    const custoUnitario = safeNumber(item.custoUnitario, 0);
    const vendaUnitaria = safeNumber(item.vendaUnitaria, 0);

    return {
      ...item,
      custoUnitario,
      vendaUnitaria,
      custoTotal: roundCurrency(custoUnitario * quantidade),
      vendaTotal: roundCurrency(vendaUnitaria * quantidade),
    };
  });

  const custoTotalCalculadoItens = roundCurrency(
    normalizedItems.reduce((acc, item) => acc + item.custoTotal, 0)
  );

  const custoTotalFinal =
    parsed.custoTotal !== null && parsed.custoTotal !== undefined
      ? roundCurrency(parsed.custoTotal)
      : custoTotalCalculadoItens;

  const valorTotalFinal = roundCurrency(parsed.valorTotal);

  const margemFinal =
    parsed.margemLucroPercentual !== null &&
    parsed.margemLucroPercentual !== undefined
      ? parsed.margemLucroPercentual
      : valorTotalFinal > 0
        ? roundPercentage(
            ((valorTotalFinal - custoTotalFinal) / valueOrOne(valorTotalFinal)) *
              100
          )
        : 0;

  const etapasNormalizadas = normalizeStages(
    parsed.etapas,
    valorTotalFinal
  );

  return normalizedBudgetDraftSchema.parse({
    titulo: parsed.titulo,
    subtitulo: parsed.subtitulo ?? null,
    descricao: parsed.descricao ?? null,

    modalidadeContratacao: parsed.modalidadeContratacao,
    prazoEstimado: parsed.prazoEstimado ?? null,
    escopoResumido: parsed.escopoResumido ?? null,

    incluiMateriais: parsed.incluiMateriais,
    incluiMaoDeObra: parsed.incluiMaoDeObra,
    incluiEquipamentos: parsed.incluiEquipamentos,

    textoApresentacao: parsed.textoApresentacao ?? null,
    condicoesComerciais: parsed.condicoesComerciais ?? null,
    garantiaTexto: parsed.garantiaTexto ?? null,

    propostaModelo: parsed.propostaModelo,

    valorTotal: valorTotalFinal,
    custoTotal: custoTotalFinal,
    margemLucroPercentual: margemFinal,

    validadeDias: parsed.validadeDias,

    diferenciais: parsed.diferenciais,
    escopoPdf: parsed.escopoPdf,
    proximosPassos: parsed.proximosPassos,

    etapas: etapasNormalizadas,
    itens: normalizedItems,

    opcoes: parsed.opcoes,
    observacoesGerais: parsed.observacoesGerais ?? null,
    rationaleResumo: parsed.rationaleResumo ?? null,
  });
}

function normalizeStages(
  stages: AIBudgetOutput["etapas"],
  valorTotal: number
) {
  const sorted = [...stages].sort((a, b) => a.ordem - b.ordem);

  const hasExplicitValues = sorted.every(
    (stage) => stage.valorTotal !== null && stage.valorTotal !== undefined
  );

  const hasPercentages = sorted.every(
    (stage) => stage.percentual !== null && stage.percentual !== undefined
  );

  if (hasExplicitValues) {
    return sorted.map((stage) => ({
      nome: stage.nome,
      descricao: stage.descricao ?? null,
      ordem: stage.ordem,
      percentual:
        stage.percentual !== null && stage.percentual !== undefined
          ? roundPercentage(stage.percentual)
          : valorTotal > 0
            ? roundPercentage(
                (safeNumber(stage.valorTotal, 0) / valueOrOne(valorTotal)) * 100
              )
            : 0,
      valorTotal: roundCurrency(safeNumber(stage.valorTotal, 0)),
      marcos: stage.marcos ?? [],
    }));
  }

  if (hasPercentages) {
    return sorted.map((stage) => {
      const percentual = safeNumber(stage.percentual, 0);

      return {
        nome: stage.nome,
        descricao: stage.descricao ?? null,
        ordem: stage.ordem,
        percentual: roundPercentage(percentual),
        valorTotal: roundCurrency((valorTotal * percentual) / 100),
        marcos: stage.marcos ?? [],
      };
    });
  }

  const equalPercent = sorted.length > 0 ? 100 / sorted.length : 0;

  return sorted.map((stage) => ({
    nome: stage.nome,
    descricao: stage.descricao ?? null,
    ordem: stage.ordem,
    percentual: roundPercentage(equalPercent),
    valorTotal: roundCurrency((valorTotal * equalPercent) / 100),
    marcos: stage.marcos ?? [],
  }));
}

/**
 * ============================================================================
 * HELPERS PARA PERSISTÊNCIA NO BANCO
 * ============================================================================
 */

export function mapNormalizedDraftToOrcamentosTable(
  draft: NormalizedBudgetDraft
) {
  return {
    titulo: draft.titulo,
    subtitulo: draft.subtitulo ?? null,
    descricao: draft.descricao ?? null,

    valor_total: draft.valorTotal,
    custo_total: draft.custoTotal,
    margem_lucro: draft.margemLucroPercentual,

    modalidade_contratacao: draft.modalidadeContratacao,
    prazo_estimado: draft.prazoEstimado ?? null,
    escopo_resumido: draft.escopoResumido ?? null,

    inclui_materiais: draft.incluiMateriais,
    inclui_mao_de_obra: draft.incluiMaoDeObra,
    inclui_equipamentos: draft.incluiEquipamentos,

    texto_apresentacao: draft.textoApresentacao ?? null,
    diferenciais: draft.diferenciais,
    escopo_pdf: draft.escopoPdf,
    condicoes_comerciais: draft.condicoesComerciais ?? null,
    garantia_texto: draft.garantiaTexto ?? null,
    proximos_passos: draft.proximosPassos,
    proposta_modelo: draft.propostaModelo,

    observacoes: draft.observacoesGerais ?? null,
  };
}

export function mapNormalizedDraftToEtapasTable(
  draft: NormalizedBudgetDraft
) {
  return draft.etapas.map((etapa) => ({
    nome: etapa.nome,
    descricao: etapa.descricao ?? null,
    ordem: etapa.ordem,
    valor_total: etapa.valorTotal,
  }));
}

export function mapNormalizedDraftToItensTable(
  draft: NormalizedBudgetDraft
) {
  return draft.itens.map((item, index) => ({
    tipo_item: item.tipoItem,
    descricao: item.descricao,
    quantidade: item.quantidade,
    custo_unitario: item.custoUnitario,
    venda_unitaria: item.vendaUnitaria,
    custo_total: item.custoTotal,
    venda_total: item.vendaTotal,
    ordem: index + 1,
    etapa_ordem_ref: item.etapaOrdemRef ?? null,
    composicao_sugerida_nome: item.composicaoSugeridaNome ?? null,
    composicao_sugerida_codigo: item.composicaoSugeridaCodigo ?? null,
    observacao_ia: item.observacao ?? null,
  }));
}

/**
 * ============================================================================
 * PARSE DA RESPOSTA DA CLAUDE
 * ============================================================================
 */

export function extractJsonFromModelResponse(responseText: string) {
  const trimmed = responseText.trim();

  if (trimmed.startsWith("{")) {
    return parseJsonSafe(trimmed, null);
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return parseJsonSafe(fencedMatch[1].trim(), null);
  }

  const genericFence = trimmed.match(/```[\w]*\s*([\s\S]*?)```/i);
  if (genericFence?.[1]) {
    return parseJsonSafe(genericFence[1].trim(), null);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return parseJsonSafe(trimmed.slice(firstBrace, lastBrace + 1), null);
  }

  return null;
}

/**
 * ============================================================================
 * DEFAULTS ÚTEIS
 * ============================================================================
 */

export const intelligentBudgetDefaults: IntelligentBudgetInput = {
  userId: "00000000-0000-0000-0000-000000000000",
  empresaId: null,
  clienteId: null,
  clienteNomeLivre: null,
  tituloBase: "",
  tipoObra: "",
  descricaoSolicitacao: "",
  cidade: null,
  estado: null,
  localObra: null,
  modalidadeDesejada: "a_definir",
  prazoDesejadoTexto: null,
  prazoDiasDesejado: null,
  valorAlvo: null,
  incluirMateriais: false,
  incluirMaoDeObra: true,
  incluirEquipamentos: false,
  gerarItensTecnicos: true,
  tentarVincularComposicoes: false,
  propostaModeloPreferido: "comercial_padrao",
  observacoesUsuario: null,
  promptBaseReferencia: null,
  outputFormats: ["json"],
};

/**
 * ============================================================================
 * FUNÇÕES INTERNAS
 * ============================================================================
 */

function safeNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function roundPercentage(value: number) {
  return Number(value.toFixed(2));
}

function valueOrOne(value: number) {
  return value === 0 ? 1 : value;
}