import { z } from "zod";
import { CategoriaImpedimento, Parte } from "@/generated/prisma/enums";
import { id, texto } from "@/lib/validacao";

export const abrirImpedimentoSchema = z.object({
  projetoId: id,
  reuniaoId: z.string().nullable().optional(),
  categoria: z.enum(CategoriaImpedimento, { error: "Escolha a categoria" }),
  descricao: texto("a descrição", { min: 10, max: 2000 }),
  parteResponsavel: z.enum(Parte, { error: "Escolha a parte responsável" }),
});
export type AbrirImpedimentoInput = z.input<typeof abrirImpedimentoSchema>;

export const resolverImpedimentoSchema = z.object({
  projetoId: id,
  impedimentoId: id,
  resolucao: texto("a resolução", { min: 10, max: 2000 }),
});
export type ResolverImpedimentoInput = z.input<typeof resolverImpedimentoSchema>;
