"use server";

import { hojeISO } from "@/lib/formatos";
import { avaliarAvanco, avaliarRetrocesso, type Fase } from "@/lib/regras/fases";
import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import type { Tx } from "@/server/db";
import { registrarHistorico } from "@/server/historico";
import { dadosDoPortao } from "../projetos/queries";
import { mudarFaseSchema } from "./schemas";

async function gravarMudanca(
  tx: Tx,
  dados: { projetoId: string; motivo: string },
  autorId: string,
  de: Fase,
  para: Fase,
) {
  await tx.projeto.update({ where: { id: dados.projetoId }, data: { fase: para } });
  await registrarHistorico(tx, {
    projetoId: dados.projetoId,
    entidade: "Projeto",
    registroId: dados.projetoId,
    acao: "ATUALIZAR",
    campo: "fase",
    valorAnterior: de,
    valorNovo: para,
    motivo: dados.motivo,
    autorId,
  });
}

/** Avança uma fase se o portão estiver liberado (seção 4). Só Líder. */
export const avancarFase = acaoDoProjeto({
  schema: mudarFaseSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const { fase } = await tx.projeto.findUniqueOrThrow({
      where: { id: dados.projetoId },
      select: { fase: true },
    });
    const portao = await dadosDoPortao(tx, dados.projetoId, hojeISO());
    const resultado = avaliarAvanco(fase, portao);
    if (!resultado.ok) throw new ErroNegocio(resultado.erro);
    await gravarMudanca(tx, dados, usuario.id, fase, resultado.destino);
    return { fase: resultado.destino };
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

/** Retrocede uma fase (exceto a partir de ENCERRADO), com motivo. Só Líder. */
export const retrocederFase = acaoDoProjeto({
  schema: mudarFaseSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const { fase } = await tx.projeto.findUniqueOrThrow({
      where: { id: dados.projetoId },
      select: { fase: true },
    });
    const resultado = avaliarRetrocesso(fase);
    if (!resultado.ok) throw new ErroNegocio(resultado.erro);
    await gravarMudanca(tx, dados, usuario.id, fase, resultado.destino);
    return { fase: resultado.destino };
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});
