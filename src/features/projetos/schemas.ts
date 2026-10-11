import { z } from "zod";
import { StatusProjeto } from "@/generated/prisma/enums";
import { UFS } from "@/lib/formatos";
import { data, dataOpcional, id, inteiro, motivo, texto } from "@/lib/validacao";

const camposProjeto = {
  nome: texto("o nome do projeto", { min: 3, max: 150 }),
  cliente: texto("o cliente", { max: 150 }),
  municipio: texto("o município", { max: 120 }),
  uf: z.enum(UFS, { error: "Escolha a UF" }),
  handoffEm: data("a data do handoff"),
  inicioPrevisto: dataOpcional(),
  fimPrevisto: dataOpcional(),
};

function fimDepoisDoInicio(d: { inicioPrevisto: string | null; fimPrevisto: string | null }) {
  return !d.inicioPrevisto || !d.fimPrevisto || d.fimPrevisto >= d.inicioPrevisto;
}
const erroFim = { message: "O fim previsto não pode ser antes do início", path: ["fimPrevisto"] };

export const criarProjetoSchema = z
  .object({
    ...camposProjeto,
    departamentos: z.array(
      z.object({ nome: z.string().trim().max(120, "Use no máximo 120 caracteres") }),
    ),
  })
  .refine(fimDepoisDoInicio, erroFim);
export type CriarProjetoInput = z.input<typeof criarProjetoSchema>;

export const editarProjetoSchema = z
  .object({
    projetoId: id,
    ...camposProjeto,
    diaReuniao: inteiro("O dia da reunião", 1, 5),
  })
  .refine(fimDepoisDoInicio, erroFim);
export type EditarProjetoInput = z.input<typeof editarProjetoSchema>;

export const alterarStatusSchema = z.object({
  projetoId: id,
  status: z.enum(StatusProjeto, { error: "Escolha o status" }),
  motivo,
});
export type AlterarStatusInput = z.input<typeof alterarStatusSchema>;

export const excluirProjetoSchema = z.object({
  projetoId: id,
  confirmacao: z.string(),
});
export type ExcluirProjetoInput = z.input<typeof excluirProjetoSchema>;

export const feriadoSchema = z.object({
  projetoId: id,
  data: data(),
  nome: texto("o nome do feriado", { max: 120 }),
});
export type FeriadoInput = z.input<typeof feriadoSchema>;

export const excluirFeriadoSchema = z.object({ projetoId: id, feriadoId: id });
