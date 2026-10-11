import { z } from "zod";
import { Parte, Prioridade, StatusTarefa } from "@/generated/prisma/enums";
import { validarBloqueio } from "@/lib/regras/tarefas";
import { dataOpcional, id, idOpcional, texto, textoOpcional } from "@/lib/validacao";

export const tarefaSchema = z
  .object({
    projetoId: id,
    tarefaId: z.string().optional(),
    titulo: texto("o título", { min: 3, max: 200 }),
    descricao: textoOpcional(4000),
    moduloId: idOpcional,
    departamentoId: idOpcional,
    /** "m:<membroId>" | "p:<pessoaId>" | "" */
    responsavel: z
      .string()
      .nullable()
      .transform((v) => v ?? ""),
    prazo: dataOpcional(),
    prioridade: z.enum(Prioridade, { error: "Escolha a prioridade" }),
    parteResponsavel: z.enum(Parte, { error: "Escolha a parte responsável" }),
    status: z.enum(StatusTarefa, { error: "Escolha o status" }),
    motivoBloqueio: textoOpcional(1000),
  })
  .superRefine((d, ctx) => {
    const erro = validarBloqueio(d.status, d.motivoBloqueio);
    if (erro) ctx.addIssue({ code: "custom", message: erro, path: ["motivoBloqueio"] });
  });
export type TarefaInput = z.input<typeof tarefaSchema>;

export const moverTarefaSchema = z
  .object({
    projetoId: id,
    tarefaId: id,
    status: z.enum(StatusTarefa),
    posicao: z.number().int().min(0),
    motivo: z.string().trim().max(1000).nullable().optional(),
  })
  .superRefine((d, ctx) => {
    const erro = validarBloqueio(d.status, d.motivo);
    if (erro) ctx.addIssue({ code: "custom", message: erro, path: ["motivo"] });
  });
export type MoverTarefaInput = z.input<typeof moverTarefaSchema>;

export const excluirTarefaSchema = z.object({ projetoId: id, tarefaId: id });
