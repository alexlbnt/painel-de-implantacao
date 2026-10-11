import { z } from "zod";
import { MOTIVO_MIN_CARACTERES } from "./regras/fases";

// Peças de schema reutilizadas pelos formulários e pelas Server Actions (mensagens em português).

export function texto(rotulo: string, { min = 1, max = 200 }: { min?: number; max?: number } = {}) {
  return z
    .string({ error: `Informe ${rotulo}` })
    .trim()
    .min(min, min <= 1 ? `Informe ${rotulo}` : `${rotulo} precisa ter pelo menos ${min} caracteres`)
    .max(max, `Use no máximo ${max} caracteres`);
}

// As transformações abaixo são idempotentes (aceitam a própria saída): o formulário valida
// e transforma no cliente, e a action valida de novo no servidor com o mesmo schema.

/** Texto opcional: string vazia vira null. */
export function textoOpcional(max = 2000) {
  return z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .nullable()
    .transform((v) => (v ? v : null));
}

/** Id opcional vindo de <select> (string vazia vira null). */
export const idOpcional = z
  .string()
  .nullable()
  .transform((v) => (v ? v : null));

/** Data obrigatória no formato do <input type="date"> ("YYYY-MM-DD"). */
export function data(rotulo = "a data") {
  return z.iso.date({ error: `Informe ${rotulo}` });
}

/** Data opcional: string vazia vira null. */
export function dataOpcional() {
  return z
    .union([z.iso.date({ error: "Data inválida" }), z.literal(""), z.null()])
    .transform((v) => (v ? v : null));
}

export const id = z.string().min(1);

/** Motivo de mudança de fase, de status ou de desmarcar critério (mínimo 10 caracteres). */
export const motivo = z
  .string()
  .trim()
  .min(
    MOTIVO_MIN_CARACTERES,
    `Explique o motivo com pelo menos ${MOTIVO_MIN_CARACTERES} caracteres`,
  )
  .max(1000, "Use no máximo 1000 caracteres");

export const emailOpcional = z
  .union([z.email("E-mail inválido").trim().toLowerCase(), z.literal(""), z.null()])
  .transform((v) => (v ? v : null));

/** Inteiro vindo de <input type="number"> ou <select> (string) ou número. */
export function inteiro(rotulo: string, min: number, max: number) {
  return z.coerce
    .number<string | number>({ error: `Informe ${rotulo.toLowerCase()}` })
    .int(`${rotulo} precisa ser um número inteiro`)
    .min(min, `${rotulo} precisa ser no mínimo ${min}`)
    .max(max, `${rotulo} pode ser no máximo ${max}`);
}
