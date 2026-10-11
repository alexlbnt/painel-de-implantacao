import "server-only";
import { validarEdicaoReuniao } from "@/lib/regras/reunioes";
import { ErroNegocio } from "@/server/acao";
import type { Tx } from "@/server/db";

/** Busca a reunião do projeto e aplica a RN08 (ata finalizada não muda). */
export async function reuniaoEditavel(tx: Tx, projetoId: string, reuniaoId: string) {
  const reuniao = await tx.reuniao.findFirst({ where: { id: reuniaoId, projetoId } });
  if (!reuniao) throw new ErroNegocio("Reunião não encontrada.");
  const erro = validarEdicaoReuniao(reuniao.status);
  if (erro) throw new ErroNegocio(erro);
  return reuniao;
}
