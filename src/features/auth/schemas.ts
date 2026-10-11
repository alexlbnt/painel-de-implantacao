import { z } from "zod";
import { SENHA_MIN } from "@/lib/constantes";

// Schemas compartilhados entre formulário (cliente) e Server Action (servidor).

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  senha: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.input<typeof loginSchema>;

export const cadastroSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "Informe seu nome (mínimo 3 caracteres)")
      .max(120, "Nome muito longo"),
    email: z.email("Informe um e-mail válido").trim().toLowerCase(),
    senha: z
      .string()
      .min(SENHA_MIN, `A senha precisa ter pelo menos ${SENHA_MIN} caracteres`)
      .max(72, "A senha pode ter no máximo 72 caracteres"),
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  });
export type CadastroInput = z.input<typeof cadastroSchema>;
