"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import {
  deleteOrcamentoAction,
  type DeleteOrcamentoState,
} from "./actions";

const initialState: DeleteOrcamentoState = {
  success: false,
};

type DeleteOrcamentoButtonProps = {
  orcamentoId: string;
  label: string;
};

export function DeleteOrcamentoButton({
  orcamentoId,
  label,
}: DeleteOrcamentoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    deleteOrcamentoAction,
    initialState
  );

  return (
    <>
      <button
        type="button"
        title="Excluir"
        aria-label={`Excluir ${label}`}
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.04] text-white/70 transition hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-orcamento-title-${orcamentoId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#252525] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <h2
                    id={`delete-orcamento-title-${orcamentoId}`}
                    className="text-base font-semibold text-white"
                  >
                    Excluir orçamento
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">
                    Esta ação remove o orçamento e seus itens vinculados.
                  </p>
                </div>
              </div>

              <button
                type="button"
                title="Fechar"
                aria-label="Fechar modal"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={formAction} className="p-5">
              <input type="hidden" name="orcamentoId" value={orcamentoId} />

              <p className="text-sm text-white/70">
                Tem certeza que deseja excluir{" "}
                <span className="font-medium text-white">{label}</span>?
              </p>

              {state.error ? (
                <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {state.error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isPending ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
