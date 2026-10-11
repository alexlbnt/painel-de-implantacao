import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { PapelProjeto } from "@/generated/prisma/enums";
import { auth } from "./auth";
import { prisma } from "./db";

// Toda permissão é checada no servidor (seção 3). Não membro recebe 404, nunca 403,
// para não revelar que o projeto existe.

export type UsuarioSessao = { id: string; nome: string; email: string };
export type MembroContexto = { id: string; papel: PapelProjeto };

/** Recusa de uma ação por papel insuficiente (ex.: Analista em ação de Líder). */
export class ErroPermissao extends Error {
  constructor(mensagem = "Você não tem permissão para fazer isso. Peça ao Líder do projeto.") {
    super(mensagem);
    this.name = "ErroPermissao";
  }
}

/** Usuário logado e ainda existente no banco, ou null. Deduplicado por requisição. */
export const obterSessao = cache(async (): Promise<UsuarioSessao | null> => {
  const sessao = await auth();
  const id = sessao?.user?.id;
  if (!id) return null;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true },
  });
  return usuario;
});

export async function exigirSessao(): Promise<UsuarioSessao> {
  const usuario = await obterSessao();
  if (!usuario) redirect("/login");
  return usuario;
}

const buscarMembro = cache(async (projetoId: string, usuarioId: string) => {
  return prisma.membroProjeto.findUnique({
    where: { projetoId_usuarioId: { projetoId, usuarioId } },
    select: { id: true, papel: true },
  });
});

/** Exige que o usuário logado seja membro do projeto; caso contrário, 404. */
export async function exigirMembro(
  projetoId: string,
): Promise<{ usuario: UsuarioSessao; membro: MembroContexto }> {
  const usuario = await exigirSessao();
  const membro = await buscarMembro(projetoId, usuario.id);
  if (!membro) notFound();
  return { usuario, membro };
}

/** Exige Líder do projeto: não membro recebe 404; Analista recebe recusa. */
export async function exigirLider(
  projetoId: string,
): Promise<{ usuario: UsuarioSessao; membro: MembroContexto }> {
  const contexto = await exigirMembro(projetoId);
  if (contexto.membro.papel !== "LIDER") {
    throw new ErroPermissao("Apenas o Líder do projeto pode fazer isso.");
  }
  return contexto;
}

export function ehLider(membro: MembroContexto): boolean {
  return membro.papel === "LIDER";
}
