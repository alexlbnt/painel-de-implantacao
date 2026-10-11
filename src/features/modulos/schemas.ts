import { z } from "zod";
import { StatusModulo } from "@/generated/prisma/enums";
import { id, inteiro, texto, textoOpcional } from "@/lib/validacao";

/** Aderência é opcional: vazio vira null. */
const aderencia = z
  .union([z.literal(""), z.null(), inteiro("A aderência", 0, 100)])
  .transform((v) => (v === "" || v === null ? null : v));

export const moduloSchema = z.object({
  projetoId: id,
  moduloId: z.string().optional(),
  nome: texto("o nome do módulo", { max: 120 }),
  status: z.enum(StatusModulo, { error: "Escolha o status" }),
  percentual: inteiro("O percentual", 0, 100),
  aderencia,
  peso: inteiro("O peso", 1, 10),
  observacao: textoOpcional(1000),
});
export type ModuloInput = z.input<typeof moduloSchema>;

export const excluirModuloSchema = z.object({ projetoId: id, moduloId: id });
