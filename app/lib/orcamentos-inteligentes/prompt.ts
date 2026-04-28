import type {
  IntelligentBudgetContext,
  IntelligentBudgetInput,
  NormalizedBudgetDraft,
} from "./schema";

/**
 * Prompt de sistema:
 * - preserva o padrão comercial da Moraes
 * - NÃO pede código PPTX
 * - pede JSON estruturado
 */
export function buildIntelligentBudgetSystemPrompt() {
  return `
Você é o assistente de orçamentos inteligentes da Moraes Construtora.

Seu trabalho é gerar ORÇAMENTOS COMERCIAIS ESTRUTURADOS para construção civil, seguindo o padrão visual, comercial e narrativo da Moraes Construtora, mas SEM gerar código JavaScript, SEM gerar PPTX e SEM gerar HTML.

OBJETIVO:
Você deve responder SOMENTE com um JSON válido, estruturado para que o sistema:
1. salve o orçamento no banco de dados,
2. exiba a proposta na interface,
3. gere PDF comercial,
4. gere PPTX editável posteriormente.

REGRAS DE IDENTIDADE DA PROPOSTA:
- A proposta deve seguir o padrão comercial da Moraes Construtora.
- O estilo deve transmitir profissionalismo, clareza, confiança e organização.
- A estrutura comercial deve refletir a lógica abaixo:
  1. Capa / apresentação
  2. Sobre / posicionamento da empresa
  3. Escopo / etapas do serviço
  4. Lista de serviços / materiais / itens relevantes
  5. Investimento e condições
  6. Fluxo de desembolso
  7. Próximos passos

REGRAS IMPORTANTES:
- NÃO escreva texto fora do JSON.
- NÃO use markdown.
- NÃO use crases.
- NÃO explique seu raciocínio.
- NÃO gere código.
- NÃO invente dados absurdos ou tecnicamente incompatíveis.
- Sempre priorize clareza comercial e plausibilidade técnica.
- Quando alguma informação estiver ausente, faça inferências moderadas e seguras.
- Quando não houver certeza, prefira descrição genérica e profissional em vez de detalhe excessivo.
- O orçamento deve ser útil tanto para revisão interna quanto para proposta comercial final.

REGRAS DE FLUXO DE PAGAMENTO:
Use como referência:
- Residencial completo: 30 + 40 + 30
- Reforma simples: 40 + 40 + 20
- Industrial / galpão: 50 + 30 + 20
- Serviço pequeno: 50 + 50
Mas você pode adaptar se o caso exigir.

REGRAS DE ITENS:
- Os itens podem ser dos tipos: material, servico, composicao, equipamento, outro.
- Quando houver contexto técnico suficiente, sugira itens coerentes com o tipo de obra.
- Quando não houver contexto suficiente, gere menos itens, mas com qualidade.
- Não invente códigos internos.
- Só sugira composição específica se houver forte aderência ao contexto fornecido.

REGRAS DE ETAPAS:
- Toda proposta deve ter pelo menos 1 etapa.
- As etapas devem ter ordem crescente.
- Cada etapa deve ter nome claro e objetivo.
- Quando possível, cada etapa deve ter percentual e/ou valor total.
- As etapas devem refletir marcos reais da execução ou do desembolso.

TOM DE ESCRITA:
- Profissional
- Comercial
- Claro
- Objetivo
- Confiante
- Sem exageros publicitários
- Português do Brasil

FORMATO OBRIGATÓRIO DA RESPOSTA:
Você deve responder com um JSON compatível com esta estrutura conceitual:

{
  "titulo": "string",
  "subtitulo": "string | null",
  "descricao": "string | null",

  "modalidadeContratacao": "mao_de_obra | mao_de_obra_e_equipamentos | completo_inclui_materiais | a_definir",
  "prazoEstimado": "string | null",
  "escopoResumido": "string | null",

  "incluiMateriais": true,
  "incluiMaoDeObra": true,
  "incluiEquipamentos": false,

  "textoApresentacao": "string | null",
  "condicoesComerciais": "string | null",
  "garantiaTexto": "string | null",

  "propostaModelo": "comercial_padrao | comercial_premium | comparativo_opcoes | pagamento_semanal",

  "valorTotal": 0,
  "custoTotal": 0,
  "margemLucroPercentual": 0,

  "validadeDias": 5,

  "diferenciais": [
    { "titulo": "string", "descricao": "string" }
  ],

  "escopoPdf": [
    { "texto": "string" }
  ],

  "proximosPassos": [
    { "titulo": "string", "descricao": "string | null" }
  ],

  "etapas": [
    {
      "nome": "string",
      "descricao": "string | null",
      "ordem": 1,
      "percentual": 30,
      "valorTotal": 10000,
      "marcos": ["string", "string"]
    }
  ],

  "itens": [
    {
      "tipoItem": "material | servico | composicao | equipamento | outro",
      "descricao": "string",
      "quantidade": 1,
      "unidadeSigla": "string | null",
      "custoUnitario": 0,
      "vendaUnitaria": 0,
      "etapaOrdemRef": 1,
      "composicaoSugeridaNome": "string | null",
      "composicaoSugeridaCodigo": "string | null",
      "observacao": "string | null"
    }
  ],

  "opcoes": [],
  "observacoesGerais": "string | null",
  "rationaleResumo": "string | null"
}

REGRAS PARA CAMPOS FINANCEIROS:
- valorTotal: obrigatório
- custoTotal: se não houver base suficiente, ainda assim forneça uma estimativa coerente
- margemLucroPercentual: coerente com valorTotal e custoTotal
- Evite valores quebrados estranhos quando não necessário

REGRAS PARA O CAMPO "diferenciais":
- Gere de 3 a 6 diferenciais quando fizer sentido
- Devem refletir confiança, organização, prazo, clareza, execução, acompanhamento

REGRAS PARA "textoApresentacao":
- Deve soar como texto de proposta comercial
- Não muito longo
- 1 a 2 parágrafos curtos no máximo

REGRAS PARA "escopoPdf":
- Liste o que entra no escopo da proposta em linguagem clara
- Pode misturar serviços, entregas e condições importantes

REGRAS PARA "proximosPassos":
- Gere passos comerciais coerentes com fechamento da proposta
- Exemplo: aprovação, alinhamento final, contrato, entrada, início da execução

VALIDAÇÃO FINAL ANTES DE RESPONDER:
- O JSON é válido?
- Os campos obrigatórios estão preenchidos?
- As etapas estão em ordem?
- Os percentuais são plausíveis?
- O tom está profissional?
- O resultado serviria para virar proposta comercial da Moraes?

Responda SOMENTE com JSON válido.
`.trim();
}

export function buildIntelligentBudgetUserPrompt(args: {
  input: IntelligentBudgetInput;
  context: IntelligentBudgetContext;
}) {
  const { input, context } = args;

  const resumoComposicoes = context.composicoesDisponiveis
    .slice(0, 25)
    .map((item, index) => {
      return [
        `${index + 1}. ${item.nome}`,
        item.codigo ? `código: ${item.codigo}` : null,
        item.unidadeMedidaNome ? `unidade: ${item.unidadeMedidaNome}` : null,
        `custo_total: ${formatNumber(item.custoTotal)}`,
        item.descricao ? `descrição: ${item.descricao}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");

  const resumoRecursos = context.recursosDisponiveis
    .slice(0, 40)
    .map((item, index) => {
      return [
        `${index + 1}. ${item.nome}`,
        `tipo: ${item.tipo}`,
        item.codigo ? `código: ${item.codigo}` : null,
        item.unidadeMedidaNome ? `unidade: ${item.unidadeMedidaNome}` : null,
        item.preco !== null && item.preco !== undefined
          ? `preço: ${formatNumber(item.preco)}`
          : null,
        item.descricao ? `descrição: ${item.descricao}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");

  const promptBase = input.promptBaseReferencia?.trim()
    ? input.promptBaseReferencia.trim()
    : "Nenhum prompt base adicional fornecido.";

  return `
Gere um orçamento inteligente para o sistema da Moraes Construtora.

DADOS FORNECIDOS PELO USUÁRIO
- userId: ${input.userId}
- empresaId: ${nullableText(input.empresaId)}
- clienteId: ${nullableText(input.clienteId)}
- clienteNomeLivre: ${nullableText(input.clienteNomeLivre)}
- tituloBase: ${input.tituloBase}
- tipoObra: ${input.tipoObra}
- descricaoSolicitacao: ${input.descricaoSolicitacao}
- cidade: ${nullableText(input.cidade)}
- estado: ${nullableText(input.estado)}
- localObra: ${nullableText(input.localObra)}
- modalidadeDesejada: ${nullableText(input.modalidadeDesejada)}
- prazoDesejadoTexto: ${nullableText(input.prazoDesejadoTexto)}
- prazoDiasDesejado: ${nullableText(
    input.prazoDiasDesejado !== null && input.prazoDiasDesejado !== undefined
      ? String(input.prazoDiasDesejado)
      : null
  )}
- valorAlvo: ${nullableText(
    input.valorAlvo !== null && input.valorAlvo !== undefined
      ? formatNumber(input.valorAlvo)
      : null
  )}
- incluirMateriais: ${String(input.incluirMateriais)}
- incluirMaoDeObra: ${String(input.incluirMaoDeObra)}
- incluirEquipamentos: ${String(input.incluirEquipamentos)}
- gerarItensTecnicos: ${String(input.gerarItensTecnicos)}
- tentarVincularComposicoes: ${String(input.tentarVincularComposicoes)}
- propostaModeloPreferido: ${input.propostaModeloPreferido}
- observacoesUsuario: ${nullableText(input.observacoesUsuario)}
- formatos desejados no sistema: ${input.outputFormats.join(", ")}

CONTEXTO DE COMPOSIÇÕES DISPONÍVEIS
${resumoComposicoes || "Nenhuma composição enviada no contexto."}

CONTEXTO DE RECURSOS DISPONÍVEIS
${resumoRecursos || "Nenhum recurso enviado no contexto."}

PROMPT BASE DE REFERÊNCIA DO NEGÓCIO / APRESENTAÇÃO
${promptBase}

INSTRUÇÕES DE USO DO CONTEXTO
- Use o tipo de obra e a descrição da solicitação como fonte principal.
- Use as composições e recursos como apoio técnico.
- Se houver composição aderente, você pode sugeri-la.
- Se não houver aderência suficiente, não force o vínculo.
- Se o valorAlvo foi informado, tente manter a proposta em uma faixa plausível próxima desse valor.
- Respeite as flags de inclusão de materiais, mão de obra e equipamentos.
- O resultado precisa parecer uma proposta real da Moraes Construtora, pronta para revisão e posterior exportação.

REGRAS ESPECÍFICAS DE QUALIDADE
- O título precisa ficar bom comercialmente.
- O subtítulo deve complementar a proposta.
- O texto de apresentação deve ser curto e profissional.
- O escopo resumido deve deixar claro o que será executado.
- As etapas devem ser coerentes com o fluxo de pagamento.
- Os itens devem fazer sentido com o tipo de obra.
- Evite excesso de itens irrelevantes.
- Se a obra for pequena, simplifique.
- Se a obra for mais robusta, detalhe melhor.

SAÍDA
- Responder SOMENTE com JSON válido.
- Não escrever nenhum texto antes ou depois.
`.trim();
}

export function buildAnthropicMessages(args: {
  input: IntelligentBudgetInput;
  context: IntelligentBudgetContext;
}) {
  return {
    system: buildIntelligentBudgetSystemPrompt(),
    user: buildIntelligentBudgetUserPrompt(args),
  };
}

export function buildBudgetGenerationDebugPayload(args: {
  input: IntelligentBudgetInput;
  context: IntelligentBudgetContext;
}) {
  const { system, user } = buildAnthropicMessages(args);

  return {
    system,
    user,
    metadata: {
      clienteId: args.input.clienteId ?? null,
      clienteNomeLivre: args.input.clienteNomeLivre ?? null,
      tipoObra: args.input.tipoObra,
      propostaModeloPreferido: args.input.propostaModeloPreferido,
      composicoesEnviadas: args.context.composicoesDisponiveis.length,
      recursosEnviados: args.context.recursosDisponiveis.length,
    },
  };
}

export function mergePromptBaseReference(params: {
  promptBaseReferencia?: string | null;
  fallbackReference?: string | null;
}) {
  const base = params.promptBaseReferencia?.trim();
  const fallback = params.fallbackReference?.trim();

  if (base && fallback) {
    return `${base}\n\n---\n\n${fallback}`;
  }

  return base || fallback || null;
}

export function buildPostGenerationGuardPrompt(args: {
  normalizedDraft: Pick<
    NormalizedBudgetDraft,
    | "titulo"
    | "subtitulo"
    | "descricao"
    | "valorTotal"
    | "custoTotal"
    | "margemLucroPercentual"
    | "modalidadeContratacao"
    | "prazoEstimado"
    | "escopoResumido"
    | "textoApresentacao"
    | "condicoesComerciais"
    | "garantiaTexto"
    | "etapas"
    | "itens"
    | "diferenciais"
    | "proximosPassos"
  >;
}) {
  const d = args.normalizedDraft;

  return `
Validação resumida do orçamento inteligente gerado:

- título: ${d.titulo}
- subtítulo: ${nullableText(d.subtitulo)}
- descrição: ${nullableText(d.descricao)}
- valor total: ${formatNumber(d.valorTotal)}
- custo total: ${formatNumber(d.custoTotal)}
- margem: ${formatNumber(d.margemLucroPercentual)}%
- modalidade: ${d.modalidadeContratacao}
- prazo estimado: ${nullableText(d.prazoEstimado)}
- escopo resumido: ${nullableText(d.escopoResumido)}
- texto apresentação: ${nullableText(d.textoApresentacao)}
- condições comerciais: ${nullableText(d.condicoesComerciais)}
- garantia: ${nullableText(d.garantiaTexto)}
- quantidade de etapas: ${d.etapas.length}
- quantidade de itens: ${d.itens.length}
- quantidade de diferenciais: ${d.diferenciais.length}
- quantidade de próximos passos: ${d.proximosPassos.length}

Este texto serve apenas como payload opcional de conferência interna.
`.trim();
}

function nullableText(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "não informado";
  }

  return value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}