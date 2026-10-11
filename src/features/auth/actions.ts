"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@/generated/prisma/client";
import { erroDeValidacao, traduzirErro, type Resultado } from "@/server/acao";
import { signIn, signOut } from "@/server/auth";
import { prisma } from "@/server/db";
import { cadastroSchema, loginSchema, type CadastroInput, type LoginInput } from "./schemas";

const DESTINO_APOS_LOGIN = "/projetos";

async function autenticar(email: string, senha: string): Promise<Resultado> {
  try {
    // Em caso de sucesso, signIn lança o redirect do Next (propagado abaixo).
    await signIn("credentials", { email, senha, redirectTo: DESTINO_APOS_LOGIN });
    return { ok: true, data: undefined };
  } catch (erro) {
    if (erro instanceof AuthError) {
      if (erro.type === "CredentialsSignin") {
        return { ok: false, erro: "E-mail ou senha incorretos." };
      }
      console.error("[auth] falha ao entrar", erro);
      return { ok: false, erro: "Não foi possível entrar agora. Tente novamente em instantes." };
    }
    throw erro;
  }
}

export async function entrar(input: LoginInput): Promise<Resultado> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return erroDeValidacao(parsed.error);
  return autenticar(parsed.data.email, parsed.data.senha);
}

export async function cadastrar(input: CadastroInput): Promise<Resultado> {
  const parsed = cadastroSchema.safeParse(input);
  if (!parsed.success) return erroDeValidacao(parsed.error);
  const { nome, email, senha } = parsed.data;

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    await prisma.usuario.create({ data: { nome, email, senhaHash } });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return {
        ok: false,
        erro: "Já existe uma conta com este e-mail.",
        campos: { email: ["Já existe uma conta com este e-mail"] },
      };
    }
    return traduzirErro(erro);
  }

  return autenticar(email, senha);
}

export async function sair(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
