import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Aplica no formulário os erros por campo devolvidos por uma Server Action. */
export function aplicarErrosDoServidor<T extends FieldValues>(
  setError: UseFormSetError<T>,
  campos: Record<string, string[]> | undefined,
) {
  if (!campos) return;
  for (const [campo, mensagens] of Object.entries(campos)) {
    const mensagem = mensagens?.[0];
    if (mensagem) setError(campo as Path<T>, { type: "server", message: mensagem });
  }
}
