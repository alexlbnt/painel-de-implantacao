import { z } from "zod";
import { Parte } from "@/generated/prisma/enums";
import { data, id, texto, textoOpcional } from "@/lib/validacao";

const hora = z
  .union([
    z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:mm"),
    z.literal(""),
    z.null(),
  ])
  .transform((v) => (v ? v : null));

export const criarReuniaoSchema = z.object({
  projetoId: id,
  tipo: z.enum(["SEMANAL", "KICKOFF"], { error: "Escolha o tipo" }),
  data: data("a data da reunião"),
});
export type CriarReuniaoInput = z.input<typeof criarReuniaoSchema>;

/** Atualização parcial da ata em rascunho: só os campos enviados são gravados. */
export const dadosReuniaoSchema = z
  .object({
    projetoId: id,
    reuniaoId: id,
    data: data("a data da reunião").optional(),
    horaInicio: hora.optional(),
    horaFim: hora.optional(),
    local: textoOpcional(200).optional(),
    resumoStatus: textoOpcional(8000).optional(),
    salvaguardas: textoOpcional(8000).optional(),
  })
  .refine((d) => !d.horaInicio || !d.horaFim || d.horaFim >= d.horaInicio, {
    message: "O horário de término não pode ser antes do início",
    path: ["horaFim"],
  });
export type DadosReuniaoInput = z.input<typeof dadosReuniaoSchema>;

/** Participante: membro da equipe, pessoa do cliente ou nome avulso (sem cadastro). */
export const participanteSchema = z
  .object({
    projetoId: id,
    reuniaoId: id,
    origem: z.string(), // "m:<membroId>" | "p:<pessoaId>" | "avulso"
    nomeAvulso: textoOpcional(150),
    parte: z.enum(Parte, { error: "Escolha a parte" }),
  })
  .refine((d) => d.origem !== "avulso" || !!d.nomeAvulso, {
    message: "Informe o nome do participante",
    path: ["nomeAvulso"],
  })
  .refine((d) => d.origem === "avulso" || /^[mp]:.+/.test(d.origem), {
    message: "Escolha o participante",
    path: ["origem"],
  });
export type ParticipanteInput = z.input<typeof participanteSchema>;

export const removerParticipanteSchema = z.object({
  projetoId: id,
  reuniaoId: id,
  participanteId: id,
});

export const decisaoSchema = z.object({
  projetoId: id,
  reuniaoId: id,
  decisaoId: z.string().optional(),
  texto: texto("a decisão", { min: 3, max: 4000 }),
});
export type DecisaoInput = z.input<typeof decisaoSchema>;

export const excluirDecisaoSchema = z.object({ projetoId: id, reuniaoId: id, decisaoId: id });

export const finalizarReuniaoSchema = z.object({ projetoId: id, reuniaoId: id });
