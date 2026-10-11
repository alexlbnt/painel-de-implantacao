import "server-only";
import { prisma } from "@/server/db";

export const LIMITE_HISTORICO = 200;

/** Histórico do projeto, mais recentes primeiro, com filtros opcionais (seção 9). */
export async function listarHistorico(
  projetoId: string,
  filtros: { entidade?: string; autorId?: string; registroId?: string } = {},
) {
  return prisma.historicoAlteracao.findMany({
    where: {
      projetoId,
      entidade: filtros.entidade || undefined,
      autorId: filtros.autorId || undefined,
      registroId: filtros.registroId || undefined,
    },
    include: { autor: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
    take: LIMITE_HISTORICO,
  });
}

export type EntradaHistorico = Awaited<ReturnType<typeof listarHistorico>>[number];

/** Opções dos filtros: entidades e autores que aparecem no histórico do projeto. */
export async function opcoesFiltroHistorico(projetoId: string) {
  const [entidades, autores] = await Promise.all([
    prisma.historicoAlteracao.findMany({
      where: { projetoId },
      distinct: ["entidade"],
      select: { entidade: true },
    }),
    prisma.historicoAlteracao.findMany({
      where: { projetoId },
      distinct: ["autorId"],
      select: { autor: { select: { id: true, nome: true } } },
    }),
  ]);
  return {
    entidades: entidades.map((e) => e.entidade).sort(),
    autores: autores.map((a) => a.autor).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  };
}
