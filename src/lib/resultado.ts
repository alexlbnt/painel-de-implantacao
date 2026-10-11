/** Resultado padrão de toda Server Action (seção 9). */
export type Resultado<T = void> =
  { ok: true; data: T } | { ok: false; erro: string; campos?: Record<string, string[]> };
