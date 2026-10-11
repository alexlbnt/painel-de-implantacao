import { z } from "zod";
import { emailOpcional, id, idOpcional, texto, textoOpcional } from "@/lib/validacao";

export const pessoaSchema = z.object({
  projetoId: id,
  pessoaId: z.string().optional(),
  nome: texto("o nome", { max: 150 }),
  cargo: textoOpcional(120),
  departamentoId: idOpcional,
  email: emailOpcional,
  telefone: textoOpcional(40),
});
export type PessoaInput = z.input<typeof pessoaSchema>;

export const excluirPessoaSchema = z.object({ projetoId: id, pessoaId: id });

export const departamentoSchema = z.object({
  projetoId: id,
  departamentoId: z.string().optional(),
  nome: texto("o nome do departamento", { max: 120 }),
});
export type DepartamentoInput = z.input<typeof departamentoSchema>;

export const excluirDepartamentoSchema = z.object({ projetoId: id, departamentoId: id });
