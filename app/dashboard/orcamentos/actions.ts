"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export type DeleteOrcamentoState = {
  success: boolean;
  error?: string;
};

export async function deleteOrcamentoAction(
  _previousState: DeleteOrcamentoState,
  formData: FormData
): Promise<DeleteOrcamentoState> {
  const orcamentoId = String(formData.get("orcamentoId") ?? "").trim();

  if (!orcamentoId) {
    return {
      success: false,
      error: "Orçamento inválido.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Sessão expirada. Faça login novamente.",
    };
  }

  const { data: usuarioRow, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (usuarioError || !usuarioRow) {
    return {
      success: false,
      error: "Não foi possível validar seu usuário.",
    };
  }

  const userId = usuarioRow.id as string;

  const { data: orcamento, error: orcamentoError } = await supabase
    .from("orcamentos")
    .select("id")
    .eq("id", orcamentoId)
    .eq("user_id", userId)
    .maybeSingle();

  if (orcamentoError) {
    return {
      success: false,
      error: `Erro ao localizar orçamento: ${orcamentoError.message}`,
    };
  }

  if (!orcamento) {
    return {
      success: false,
      error: "Orçamento não encontrado ou sem permissão para excluir.",
    };
  }

  const { error: itensError } = await supabase
    .from("orcamento_itens")
    .delete()
    .eq("orcamento_id", orcamentoId);

  if (itensError) {
    return {
      success: false,
      error: `Erro ao excluir itens do orçamento: ${itensError.message}`,
    };
  }

  const { error: etapasError } = await supabase
    .from("orcamento_etapas")
    .delete()
    .eq("orcamento_id", orcamentoId);

  if (etapasError) {
    return {
      success: false,
      error: `Erro ao excluir etapas do orçamento: ${etapasError.message}`,
    };
  }

  const { error: deleteError } = await supabase
    .from("orcamentos")
    .delete()
    .eq("id", orcamentoId)
    .eq("user_id", userId);

  if (deleteError) {
    return {
      success: false,
      error: `Erro ao excluir orçamento: ${deleteError.message}`,
    };
  }

  revalidatePath("/dashboard/orcamentos");

  return { success: true };
}
