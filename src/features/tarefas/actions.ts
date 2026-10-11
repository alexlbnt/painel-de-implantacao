"use server";

import { isoParaDataOuNulo } from "@/lib/datas";
import { camposDoStatus, decodificarResponsavel, reposicionar } from "@/lib/regras/tarefas";
import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import type { Tx } from "@/server/db";
import { registrarAlteracoes, registrarHistorico } from "@/server/historico";
import { excluirTarefaSchema, moverTarefaSchema, tarefaSchema } from "./schemas";

/** Confere que módulo, departamento e responsável pertencem ao projeto e devolve os nomes. */
async function resolverReferencias(
  tx: Tx,
  projetoId: string,
  ref: {
    moduloId: string | null;
    departamentoId: string | null;
    membroId: string | null;
    pessoaId: string | null;
  },
) {
  const [modulo, departamento, membro, pessoa] = await Promise.all([
    ref.moduloId
      ? tx.modulo.findFirst({ where: { id: ref.moduloId, projetoId }, select: { nome: true } })
      : null,
    ref.departamentoId
      ? tx.departamento.findFirst({
          where: { id: ref.departamentoId, projetoId },
          select: { nome: true },
        })
      : null,
    ref.membroId
      ? tx.membroProjeto.findFirst({
          where: { id: ref.membroId, projetoId },
          select: { usuario: { select: { nome: true } } },
        })
      : null,
    ref.pessoaId
      ? tx.pessoaCliente.findFirst({
          where: { id: ref.pessoaId, projetoId },
          select: { nome: true },
        })
      : null,
  ]);
  if (ref.moduloId && !modulo) throw new ErroNegocio("Módulo não encontrado neste projeto.");
  if (ref.departamentoId && !departamento)
    throw new ErroNegocio("Departamento não encontrado neste projeto.");
  if ((ref.membroId && !membro) || (ref.pessoaId && !pessoa)) {
    throw new ErroNegocio("Responsável não encontrado neste projeto.");
  }
  return {
    modulo: modulo?.nome ?? null,
    departamento: departamento?.nome ?? null,
    responsavel: membro?.usuario.nome ?? pessoa?.nome ?? null,
  };
}

const CAMPOS_HISTORICO = [
  "titulo",
  "descricao",
  "prazo",
  "prioridade",
  "status",
  "parteResponsavel",
  "motivoBloqueio",
  "modulo",
  "departamento",
  "responsavel",
] as const;

/** Cria ou edita tarefa (RF04). Bloqueio exige motivo (RN11). */
export const salvarTarefa = acaoDoProjeto({
  schema: tarefaSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const resp = decodificarResponsavel(dados.responsavel);
    const nomes = await resolverReferencias(tx, dados.projetoId, {
      moduloId: dados.moduloId,
      departamentoId: dados.departamentoId,
      membroId: resp.membroId,
      pessoaId: resp.pessoaId,
    });
    const base = {
      titulo: dados.titulo,
      descricao: dados.descricao,
      moduloId: dados.moduloId,
      departamentoId: dados.departamentoId,
      responsavelMembroId: resp.membroId,
      responsavelPessoaId: resp.pessoaId,
      prazo: isoParaDataOuNulo(dados.prazo),
      prioridade: dados.prioridade,
      parteResponsavel: dados.parteResponsavel,
    };

    if (!dados.tarefaId) {
      const ultima = await tx.tarefa.findFirst({
        where: { projetoId: dados.projetoId, status: dados.status },
        orderBy: { ordem: "desc" },
        select: { ordem: true },
      });
      const tarefa = await tx.tarefa.create({
        data: {
          projetoId: dados.projetoId,
          ...base,
          ...camposDoStatus(
            { status: "A_FAZER", concluidaEm: null },
            dados.status,
            dados.motivoBloqueio,
            new Date(),
          ),
          ordem: (ultima?.ordem ?? -1) + 1,
        },
      });
      await registrarHistorico(tx, {
        projetoId: dados.projetoId,
        entidade: "Tarefa",
        registroId: tarefa.id,
        acao: "CRIAR",
        valorNovo: tarefa.titulo,
        autorId: usuario.id,
      });
      return { id: tarefa.id };
    }

    const anterior = await tx.tarefa.findFirst({
      where: { id: dados.tarefaId, projetoId: dados.projetoId },
      include: {
        modulo: { select: { nome: true } },
        departamento: { select: { nome: true } },
        responsavelMembro: { select: { usuario: { select: { nome: true } } } },
        responsavelPessoa: { select: { nome: true } },
      },
    });
    if (!anterior) throw new ErroNegocio("Tarefa não encontrada.");
    const status = camposDoStatus(anterior, dados.status, dados.motivoBloqueio, new Date());
    await tx.tarefa.update({ where: { id: anterior.id }, data: { ...base, ...status } });
    await registrarAlteracoes(
      tx,
      {
        projetoId: dados.projetoId,
        entidade: "Tarefa",
        registroId: anterior.id,
        autorId: usuario.id,
      },
      {
        ...anterior,
        modulo: anterior.modulo?.nome ?? null,
        departamento: anterior.departamento?.nome ?? null,
        responsavel:
          anterior.responsavelMembro?.usuario.nome ?? anterior.responsavelPessoa?.nome ?? null,
      },
      { ...base, ...status, ...nomes },
      CAMPOS_HISTORICO,
    );
    return { id: anterior.id };
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

/** Move no quadro: muda o status (bloqueio exige motivo) e reordena a coluna de destino. */
export const moverTarefa = acaoDoProjeto({
  schema: moverTarefaSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const anterior = await tx.tarefa.findFirst({
      where: { id: dados.tarefaId, projetoId: dados.projetoId },
      select: { id: true, status: true, concluidaEm: true, motivoBloqueio: true },
    });
    if (!anterior) throw new ErroNegocio("Tarefa não encontrada.");

    const coluna = await tx.tarefa.findMany({
      where: { projetoId: dados.projetoId, status: dados.status },
      orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
      select: { id: true },
    });
    const ordem = reposicionar(
      coluna.map((t) => t.id),
      anterior.id,
      dados.posicao,
    );
    const status =
      anterior.status === dados.status
        ? null
        : camposDoStatus(anterior, dados.status, dados.motivo, new Date());

    await Promise.all(
      ordem.map((tarefaId, i) =>
        tx.tarefa.update({
          where: { id: tarefaId },
          data: tarefaId === anterior.id && status ? { ordem: i, ...status } : { ordem: i },
        }),
      ),
    );
    if (status) {
      await registrarAlteracoes(
        tx,
        {
          projetoId: dados.projetoId,
          entidade: "Tarefa",
          registroId: anterior.id,
          autorId: usuario.id,
        },
        anterior,
        status,
        ["status", "motivoBloqueio"],
      );
    }
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

export const excluirTarefa = acaoDoProjeto({
  schema: excluirTarefaSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const tarefa = await tx.tarefa.findFirst({
      where: { id: dados.tarefaId, projetoId: dados.projetoId },
      select: { id: true, titulo: true },
    });
    if (!tarefa) throw new ErroNegocio("Tarefa não encontrada.");
    await tx.tarefa.delete({ where: { id: tarefa.id } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Tarefa",
      registroId: tarefa.id,
      acao: "EXCLUIR",
      valorAnterior: tarefa.titulo,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});
