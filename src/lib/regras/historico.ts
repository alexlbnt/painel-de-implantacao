// Regras puras do histórico de alterações (RN01, RNF01).

export type ValorHistorico = string | number | boolean | null;

export type Diferenca = {
  campo: string;
  valorAnterior: ValorHistorico;
  valorNovo: ValorHistorico;
};

/** Normaliza um valor para gravação em JSON: datas viram ISO, undefined vira null. */
export function normalizarValor(valor: unknown): ValorHistorico {
  if (valor === undefined || valor === null) return null;
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean") {
    return valor;
  }
  return JSON.stringify(valor);
}

/**
 * Compara dois estados e devolve uma diferença por campo alterado
 * (em atualizações, o histórico grava uma linha por campo — seção 9).
 * Só considera os campos listados.
 */
export function diferencas<T extends Record<string, unknown>>(
  anterior: T,
  novo: Partial<T>,
  campos: readonly (keyof T & string)[],
): Diferenca[] {
  const resultado: Diferenca[] = [];
  for (const campo of campos) {
    if (!(campo in novo)) continue;
    const antes = normalizarValor(anterior[campo]);
    const depois = normalizarValor(novo[campo]);
    if (antes !== depois) resultado.push({ campo, valorAnterior: antes, valorNovo: depois });
  }
  return resultado;
}
