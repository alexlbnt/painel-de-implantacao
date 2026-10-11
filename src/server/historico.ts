import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { AcaoHistorico } from "@/generated/prisma/enums";
import { diferencas, normalizarValor, type ValorHistorico } from "@/lib/regras/historico";
import type { Tx } from "./db";

// Histórico gravado SEMPRE com o `tx` da mesma transação da escrita (RN01, seção 9).

export type EntradaHistorico = {
  projetoId: string;
  entidade: string;
  registroId: string;
  acao: AcaoHistorico;
  campo?: string;
  valorAnterior?: unknown;
  valorNovo?: unknown;
  motivo?: string;
  autorId: string;
};

function paraJson(valor: unknown) {
  if (valor === undefined) return undefined;
  const normalizado: ValorHistorico = normalizarValor(valor);
  return normalizado === null ? Prisma.DbNull : normalizado;
}

export async function registrarHistorico(tx: Tx, entrada: EntradaHistorico) {
  await tx.historicoAlteracao.create({
    data: {
      projetoId: entrada.projetoId,
      entidade: entrada.entidade,
      registroId: entrada.registroId,
      acao: entrada.acao,
      campo: entrada.campo,
      valorAnterior: paraJson(entrada.valorAnterior),
      valorNovo: paraJson(entrada.valorNovo),
      motivo: entrada.motivo,
      autorId: entrada.autorId,
    },
  });
}

/** Em atualizações: grava uma linha por campo alterado. Retorna quantas linhas gravou. */
export async function registrarAlteracoes<T extends Record<string, unknown>>(
  tx: Tx,
  base: Omit<EntradaHistorico, "acao" | "campo" | "valorAnterior" | "valorNovo">,
  anterior: T,
  novo: Partial<T>,
  campos: readonly (keyof T & string)[],
): Promise<number> {
  const lista = diferencas(anterior, novo, campos);
  if (lista.length === 0) return 0;
  await tx.historicoAlteracao.createMany({
    data: lista.map((d) => ({
      projetoId: base.projetoId,
      entidade: base.entidade,
      registroId: base.registroId,
      acao: "ATUALIZAR" as const,
      campo: d.campo,
      valorAnterior: paraJson(d.valorAnterior),
      valorNovo: paraJson(d.valorNovo),
      motivo: base.motivo,
      autorId: base.autorId,
    })),
  });
  return lista.length;
}
