//app\dashboard\orcamentos\novo\inteligente\page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Loader2,
  Search,
  Sparkles,
  User2,
  Wrench,
  Building2,
  X,
  Layers3,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import "@/app/components/css/AmbientGlow.css";

type ClienteOption = {
  id: string;
  nome: string;
};

type ComposicaoOption = {
  id: string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  custo_total: number | string;
};

type ModalidadeContratacao =
  | "mao_de_obra"
  | "mao_de_obra_e_equipamentos"
  | "completo_inclui_materiais"
  | "a_definir";

type PropostaModelo =
  | "comercial_padrao"
  | "comercial_premium"
  | "comparativo_opcoes"
  | "pagamento_semanal";

type ApiSuccessResponse = {
  success: true;
  orcamento_id: string;
  status: string;
};

type ApiErrorResponse = {
  error?: string;
  details?: unknown;
};

export default function NovoOrcamentoInteligentePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [composicoes, setComposicoes] = useState<ComposicaoOption[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [clienteNomeLivre, setClienteNomeLivre] = useState("");

  const [tituloBase, setTituloBase] = useState("");
  const [tipoObra, setTipoObra] = useState("");
  const [descricaoSolicitacao, setDescricaoSolicitacao] = useState("");

  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [localObra, setLocalObra] = useState("");

  const [modalidadeDesejada, setModalidadeDesejada] =
    useState<ModalidadeContratacao>("a_definir");

  const [prazoDesejadoTexto, setPrazoDesejadoTexto] = useState("");
  const [prazoDiasDesejado, setPrazoDiasDesejado] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");

  const [incluirMateriais, setIncluirMateriais] = useState(false);
  const [incluirMaoDeObra, setIncluirMaoDeObra] = useState(true);
  const [incluirEquipamentos, setIncluirEquipamentos] = useState(false);

  const [gerarItensTecnicos, setGerarItensTecnicos] = useState(true);
  const [tentarVincularComposicoes, setTentarVincularComposicoes] =
    useState(true);

  const [propostaModeloPreferido, setPropostaModeloPreferido] =
    useState<PropostaModelo>("comercial_padrao");

  const [promptBaseReferencia, setPromptBaseReferencia] = useState("");
  const [observacoesUsuario, setObservacoesUsuario] = useState("");

  const [compositionSearch, setCompositionSearch] = useState("");
  const [selectedCompositionIds, setSelectedCompositionIds] = useState<string[]>(
    []
  );

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setLoadingInitial(true);
        setErrorMessage("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: usuarioRow, error: usuarioError } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (usuarioError) {
          throw new Error(usuarioError.message);
        }

        if (!usuarioRow?.id) {
          throw new Error("Usuário interno não encontrado.");
        }

        const internalId = usuarioRow.id as string;

        const [{ data: clientesData, error: clientesError }, { data: composicoesData, error: composicoesError }] =
          await Promise.all([
            supabase
              .from("clientes")
              .select("id, nome")
              .eq("user_id", internalId)
              .eq("ativo", true)
              .order("nome", { ascending: true }),

            supabase
              .from("composicoes")
              .select("id, codigo, nome, descricao, custo_total")
              .eq("user_id", internalId)
              .eq("ativo", true)
              .order("updated_at", { ascending: false })
              .limit(150),
          ]);

        if (clientesError) {
          throw new Error(clientesError.message);
        }

        if (composicoesError) {
          throw new Error(composicoesError.message);
        }

        if (!mounted) return;

        setInternalUserId(internalId);
        setClientes((clientesData ?? []) as ClienteOption[]);
        setComposicoes((composicoesData ?? []) as ComposicaoOption[]);
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar dados iniciais."
        );
      } finally {
        if (mounted) {
          setLoadingInitial(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const filteredComposicoes = useMemo(() => {
    const term = compositionSearch.trim().toLowerCase();
    if (!term) return composicoes.slice(0, 20);

    return composicoes
      .filter((item) => {
        const haystack = [
          item.codigo ?? "",
          item.nome ?? "",
          item.descricao ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(term);
      })
      .slice(0, 20);
  }, [compositionSearch, composicoes]);

  const selectedComposicoes = useMemo(() => {
    const selectedSet = new Set(selectedCompositionIds);
    return composicoes.filter((item) => selectedSet.has(item.id));
  }, [selectedCompositionIds, composicoes]);

  function toggleComposition(id: string) {
    setSelectedCompositionIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!internalUserId) {
      setErrorMessage("Usuário interno não carregado.");
      return;
    }

    if (!tituloBase.trim()) {
      setErrorMessage("Informe um título base.");
      return;
    }

    if (!tipoObra.trim()) {
      setErrorMessage("Informe o tipo de obra.");
      return;
    }

    if (!descricaoSolicitacao.trim()) {
      setErrorMessage("Descreva no prompt como deseja montar o orçamento.");
      return;
    }

    if (!clienteId && !clienteNomeLivre.trim()) {
      setErrorMessage("Selecione um cliente ou informe um nome livre.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        userId: internalUserId,
        empresaId: null,

        clienteId: clienteId || null,
        clienteNomeLivre: clienteNomeLivre.trim() || null,

        tituloBase: tituloBase.trim(),
        tipoObra: tipoObra.trim(),
        descricaoSolicitacao: descricaoSolicitacao.trim(),

        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        localObra: localObra.trim() || null,

        modalidadeDesejada,
        prazoDesejadoTexto: prazoDesejadoTexto.trim() || null,
        prazoDiasDesejado: prazoDiasDesejado
          ? Number(prazoDiasDesejado)
          : null,

        valorAlvo: valorAlvo ? parseBrazilianNumber(valorAlvo) : null,

        incluirMateriais,
        incluirMaoDeObra,
        incluirEquipamentos,

        gerarItensTecnicos,
        tentarVincularComposicoes,

        propostaModeloPreferido,

        observacoesUsuario: observacoesUsuario.trim() || null,
        promptBaseReferencia: promptBaseReferencia.trim() || null,

        selectedCompositionIds,
        outputFormats: ["json"],
      };

      const response = await fetch("/api/orcamentos/inteligente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as
        | ApiSuccessResponse
        | ApiErrorResponse;

      if (!response.ok) {
        const details =
          "details" in json && json.details
            ? ` ${JSON.stringify(json.details)}`
            : "";

        const apiErrorMessage =
          "error" in json && typeof json.error === "string"
            ? json.error
            : "Erro ao gerar orçamento inteligente.";

        throw new Error(`${apiErrorMessage}${details}`);
      }

      if (!("success" in json) || !json.success || !json.orcamento_id) {
        throw new Error("Resposta inválida ao gerar orçamento.");
      }

      setSuccessMessage("Orçamento inteligente gerado com sucesso.");
      router.push(`/dashboard/orcamentos/${json.orcamento_id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao gerar orçamento inteligente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,80,23,0.12),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

        <div className="relative z-10">
          <Link
            href="/dashboard/orcamentos"
            className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para orçamentos
          </Link>

          <div className="mt-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF5017]/20 bg-[#FF5017]/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[#FF8A63]">
              <Sparkles className="h-3.5 w-3.5" />
              Novo orçamento inteligente
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Gere uma proposta com apoio de IA
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
              Escreva do seu jeito, selecione as composições que quer usar como
              base e deixe a IA montar um rascunho comercial para revisão.
            </p>
          </div>
        </div>
      </section>

      {loadingInitial ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-[20px] border border-white/5 bg-[#252525] p-6 text-white/60">
          <div className="inline-flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando formulário...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <CardBlock
            title="Instruções para a IA"
            description="Esse é o campo principal. Escreva como você falaria com a Claude."
          >
            <div className="space-y-4">
              <Field label="Prompt principal *">
                <div className="prompt-aurora-wrap">
                  <div className="prompt-aurora-light" />

                  <textarea
                    value={descricaoSolicitacao}
                    onChange={(e) => setDescricaoSolicitacao(e.target.value)}
                    placeholder="Ex: criar proposta para construção residencial do cliente João, casa térrea com 3 quartos, acabamento médio. Quero proposta mais comercial, dividir em 3 etapas, considerar mão de obra e equipamentos. O piso dessa obra deve entrar com preço especial abaixo do valor padrão."
                    className={`${inputClassName} prompt-aurora-input min-h-[220px] resize-y`}
                    required
                  />
                </div>
              </Field>

             
            </div>
          </CardBlock>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
            <CardBlock
              title="Dados essenciais"
              description="Informações principais para identificar a obra e o cliente."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Cliente cadastrado">
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Selecionar cliente</option>
                    {clientes.map((cliente) => (
                      <option
                        key={cliente.id}
                        value={cliente.id}
                        className="bg-[#252525]"
                      >
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nome livre do cliente">
                  <input
                    value={clienteNomeLivre}
                    onChange={(e) => setClienteNomeLivre(e.target.value)}
                    placeholder="Use se não quiser selecionar cliente"
                    className={inputClassName}
                  />
                </Field>

                <Field label="Título base *" className="md:col-span-2">
                  <input
                    value={tituloBase}
                    onChange={(e) => setTituloBase(e.target.value)}
                    placeholder="Ex: Construção Residencial - Casa Térrea"
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field label="Tipo de obra *">
                  <input
                    value={tipoObra}
                    onChange={(e) => setTipoObra(e.target.value)}
                    placeholder="Ex: Construção residencial, reforma, galpão"
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field label="Modalidade desejada">
                  <select
                    value={modalidadeDesejada}
                    onChange={(e) =>
                      setModalidadeDesejada(
                        e.target.value as ModalidadeContratacao
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="a_definir" className="bg-[#252525]">
                      A definir
                    </option>
                    <option value="mao_de_obra" className="bg-[#252525]">
                      Mão de obra
                    </option>
                    <option
                      value="mao_de_obra_e_equipamentos"
                      className="bg-[#252525]"
                    >
                      Mão de obra e equipamentos
                    </option>
                    <option
                      value="completo_inclui_materiais"
                      className="bg-[#252525]"
                    >
                      Completo inclui materiais
                    </option>
                  </select>
                </Field>
              </div>
            </CardBlock>

            <CardBlock
              title="Parâmetros comerciais"
              description="Esses campos ajudam a IA a aproximar o orçamento da realidade desejada."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Prazo desejado (texto)">
                  <input
                    value={prazoDesejadoTexto}
                    onChange={(e) => setPrazoDesejadoTexto(e.target.value)}
                    placeholder="Ex: 4 meses"
                    className={inputClassName}
                  />
                </Field>

                <Field label="Prazo desejado em dias">
                  <input
                    value={prazoDiasDesejado}
                    onChange={(e) => setPrazoDiasDesejado(onlyNumber(e.target.value))}
                    placeholder="Ex: 120"
                    inputMode="numeric"
                    className={inputClassName}
                  />
                </Field>

                <Field label="Valor alvo (R$)">
                  <input
                    value={valorAlvo}
                    onChange={(e) => setValorAlvo(e.target.value)}
                    placeholder="Ex: 74000"
                    inputMode="decimal"
                    className={inputClassName}
                  />
                </Field>

                <Field label="Modelo da proposta">
                  <select
                    value={propostaModeloPreferido}
                    onChange={(e) =>
                      setPropostaModeloPreferido(
                        e.target.value as PropostaModelo
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="comercial_padrao" className="bg-[#252525]">
                      Comercial padrão
                    </option>
                    <option value="comercial_premium" className="bg-[#252525]">
                      Comercial premium
                    </option>
                    <option value="comparativo_opcoes" className="bg-[#252525]">
                      Comparativo de opções
                    </option>
                    <option value="pagamento_semanal" className="bg-[#252525]">
                      Pagamento semanal
                    </option>
                  </select>
                </Field>

                <Field label="Cidade">
                  <input
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: Belo Horizonte"
                    className={inputClassName}
                  />
                </Field>

                <Field label="Estado">
                  <input
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    placeholder="Ex: MG"
                    className={inputClassName}
                  />
                </Field>

                <Field label="Local da obra" className="md:col-span-2">
                  <input
                    value={localObra}
                    onChange={(e) => setLocalObra(e.target.value)}
                    placeholder="Ex: Bairro, condomínio ou referência"
                    className={inputClassName}
                  />
                </Field>
              </div>
            </CardBlock>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <CardBlock
              title="Selecionar composições"
              description="Escolha composições para servir como base do orçamento inteligente."
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
                  <Search className="h-4 w-4 text-white/35" />
                  <input
                    value={compositionSearch}
                    onChange={(e) => setCompositionSearch(e.target.value)}
                    placeholder="Buscar por código, nome ou descrição"
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  />
                </div>

                {selectedComposicoes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedComposicoes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleComposition(item.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#FF5017]/20 bg-[#FF5017]/10 px-3 py-2 text-xs font-medium text-[#FF8A63]"
                      >
                        <Layers3 className="h-3.5 w-3.5" />
                        <span className="max-w-[220px] truncate">
                          {item.codigo ? `${item.codigo} · ` : ""}
                          {item.nome}
                        </span>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
                    Nenhuma composição selecionada ainda.
                  </div>
                )}

                <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
                  {filteredComposicoes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
                      Nenhuma composição encontrada.
                    </div>
                  ) : (
                    filteredComposicoes.map((item) => {
                      const isSelected = selectedCompositionIds.includes(item.id);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleComposition(item.id)}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                            isSelected
                              ? "border-[#FF5017]/30 bg-[#FF5017]/10"
                              : "border-white/5 bg-white/[0.04] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                {item.codigo ? (
                                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/45">
                                    {item.codigo}
                                  </span>
                                ) : null}

                                {isSelected ? (
                                  <span className="rounded-full border border-[#FF5017]/20 bg-[#FF5017]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#FF8A63]">
                                    Selecionada
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 text-sm font-medium text-white">
                                {item.nome}
                              </p>

                              {item.descricao?.trim() ? (
                                <p className="mt-1 line-clamp-2 text-sm text-white/50">
                                  {item.descricao}
                                </p>
                              ) : null}
                            </div>

                            <div className="shrink-0 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2 text-right">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                                Custo
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                {formatCurrency(Number(item.custo_total ?? 0))}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </CardBlock>

            <CardBlock
              title="Configurações técnicas"
              description="Defina o que a IA deve considerar ao estruturar a proposta."
            >
              <div className="space-y-3">
                <SwitchRow
                  icon={<Building2 className="h-4 w-4" />}
                  title="Incluir materiais"
                  description="Permite que a proposta considere materiais."
                  checked={incluirMateriais}
                  onChange={setIncluirMateriais}
                />

                <SwitchRow
                  icon={<User2 className="h-4 w-4" />}
                  title="Incluir mão de obra"
                  description="Mantém a mão de obra considerada no orçamento."
                  checked={incluirMaoDeObra}
                  onChange={setIncluirMaoDeObra}
                />

                <SwitchRow
                  icon={<Wrench className="h-4 w-4" />}
                  title="Incluir equipamentos"
                  description="Permite sugerir equipamentos na proposta."
                  checked={incluirEquipamentos}
                  onChange={setIncluirEquipamentos}
                />

                <SwitchRow
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Gerar itens técnicos"
                  description="Pede que a IA sugira itens além do texto comercial."
                  checked={gerarItensTecnicos}
                  onChange={setGerarItensTecnicos}
                />

                <SwitchRow
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Tentar vincular composições"
                  description="A IA tenta se aproximar das composições escolhidas."
                  checked={tentarVincularComposicoes}
                  onChange={setTentarVincularComposicoes}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-sm text-white/55">
                <p className="font-medium text-white/75">Resumo atual</p>
                <div className="mt-3 space-y-2">
                  <p>• Composições selecionadas: {selectedCompositionIds.length}</p>
                  <p>• Materiais: {incluirMateriais ? "Sim" : "Não"}</p>
                  <p>• Mão de obra: {incluirMaoDeObra ? "Sim" : "Não"}</p>
                  <p>• Equipamentos: {incluirEquipamentos ? "Sim" : "Não"}</p>
                </div>
              </div>
            </CardBlock>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <CardBlock
              title="Complementos"
              description="Espaço extra para briefing, regras ou observações comerciais."
            >
              <div className="space-y-4">
                <Field label="Observações do usuário">
                  <textarea
                    value={observacoesUsuario}
                    onChange={(e) => setObservacoesUsuario(e.target.value)}
                    placeholder="Ex: destacar garantia, proposta mais objetiva, evitar detalhamento excessivo..."
                    className={`${inputClassName} min-h-[120px] resize-y`}
                  />
                </Field>

                <Field label="Prompt base de referência">
                  <textarea
                    value={promptBaseReferencia}
                    onChange={(e) => setPromptBaseReferencia(e.target.value)}
                    placeholder="Cole aqui instruções comerciais, padrão de linguagem ou referência usada anteriormente..."
                    className={`${inputClassName} min-h-[180px] resize-y`}
                  />
                </Field>
              </div>
            </CardBlock>

            <CardBlock
              title="Como usar melhor"
              description="Algumas dicas para a IA entregar algo mais próximo do que você quer."
            >
              <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-sm text-white/55">
                <p>• Use o prompt para explicar ajustes comerciais específicos.</p>
                <p>• Selecione composições que sirvam como base do orçamento.</p>
                <p>• Informe prazo e valor alvo quando quiser guiar melhor a proposta.</p>
                <p>• Se quiser uma proposta mais comercial, escreva isso no prompt.</p>
                <p>• Se algum item deve sair por preço diferente do padrão, diga isso claramente.</p>
              </div>
            </CardBlock>
          </section>

          {(errorMessage || successMessage) && (
            <div
              className={`rounded-[20px] border p-4 text-sm ${
                errorMessage
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {errorMessage || successMessage}
            </div>
          )}

          <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />

            <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Gerar orçamento inteligente
                </h2>
                <p className="text-sm text-white/50">
                  A IA vai criar um rascunho com proposta comercial, etapas e
                  itens sugeridos para revisão.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard/orcamentos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08]"
                >
                  Cancelar
                </Link>

                <button
                  type="submit"
                  disabled={submitting || loadingInitial}
                  className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-[#FF5017] px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando orçamento...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      Gerar com IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}

function CardBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-visible rounded-[20px] border border-white/5 bg-[#252525] p-4 shadow-lg sm:rounded-[28px] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,80,23,0.08),transparent_40%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,transparent_70%,rgba(255,255,255,0.015))]" />
      </div>
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

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-white/75">
        {label}
      </span>
      {children}
    </label>
  );
}

function SwitchRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 text-white/45">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/50">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#FF5017]" : "bg-white/10"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#FF5017]/30 focus:bg-white/[0.06]";

function onlyNumber(value: string) {
  return value.replace(/\D/g, "");
}

function parseBrazilianNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
