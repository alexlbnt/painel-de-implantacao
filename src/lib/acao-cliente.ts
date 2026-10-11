"use client";

import type { FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import type { Resultado } from "./resultado";
import { aplicarErrosDoServidor } from "./formulario";

/**
 * Trata o resultado de uma Server Action no cliente: toast de sucesso ou erro (seção 11)
 * e erros por campo no formulário. Devolve true quando deu certo.
 */
export function tratarResultado<T, F extends FieldValues = FieldValues>(
  r: Resultado<T>,
  opcoes: { sucesso?: string; setError?: UseFormSetError<F> } = {},
): r is { ok: true; data: T } {
  if (r.ok) {
    if (opcoes.sucesso) toast.success(opcoes.sucesso);
    return true;
  }
  if (opcoes.setError) aplicarErrosDoServidor(opcoes.setError, r.campos);
  toast.error(r.erro);
  return false;
}
