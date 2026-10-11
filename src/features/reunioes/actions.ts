"use server";

import { Prisma } from "@/generated/prisma/client";
import { isoParaData } from "@/lib/datas";
import { LABEL_TIPO_REUNIAO } from "@/lib/formatos";
import { montarSnapshot, proximoNumero, renumerar, validarAcoesDaAta } from "@/lib/regras/reunioes";
import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import { registrarAlteracoes, registrarHistorico } from "@/server/historico";
import { dadosDaAta, paraSnapshot } from "./queries";
import { reuniaoEditavel } from "./servidor";
import {
  criarReuniaoSchema,
  dadosReuniaoSchema,
  decisaoSchema,
  excluirDecisaoSchema,
  finalizarReuniaoSchema,
  participanteSchema,
  removerParticipanteSchema,
} from "./schemas";

const caminho = (d: { projetoId: string }) => `/projetos/${d.projetoId}`;

/** Cria reunião com número sequencial por projeto, calculado dentro da transação (seção 10). */
export const criarReuniao = acaoDoProjeto({
  schema: criarReuniaoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const existentes = await tx.reuniao.findMany({
      where: { projetoId: dados.projetoId },
      select: { numero: true },
    });
    const numero = proximoNumero(existentes.map((r) => r.numero));
    const reuniao = await tx.reuniao.create({
      data: { projetoId: dados.projetoId, tipo: dados.tipo, numero, data: isoParaData(dados.data) },
    });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Reuniao",
      registroId: reuniao.id,
      acao: "CRIAR",
      valorNovo: `Reunião nº ${numero} (${LABEL_TIPO_REUNIAO[dados.tipo]}) em ${dados.data}`,
      autorId: usuario.id,
    });
    return { id: reuniao.id };
  },
  revalidar: caminho,
});

const CAMPOS_DADOS = [
  "data",
  "horaInicio",
  "horaFim",
  "local",
  "resumoStatus",
  "salvaguardas",
] as const;

/** Atualiza os campos enviados da ata em rascunho. */
export const salvarDadosReuniao = acaoDoProjeto({
  schema: dadosReuniaoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const anterior = await reuniaoEditavel(tx, dados.projetoId, dados.reuniaoId);
    const novo: {
      data?: Date;
      horaInicio?: string | null;
      horaFim?: string | null;
      local?: string | null;
      resumoStatus?: string | null;
      salvaguardas?: string | null;
    } = {};
    if (dados.data !== undefined) novo.data = isoParaData(dados.data);
    for (const campo of [
      "horaInicio",
      "horaFim",
      "local",
      "resumoStatus",
      "salvaguardas",
    ] as const) {
      if (dados[campo] !== undefined) novo[campo] = dados[campo];
    }
    await tx.reuniao.update({ where: { id: anterior.id }, data: novo });
    await registrarAlteracoes(
      tx,
      {
        projetoId: dados.projetoId,
        entidade: "Reuniao",
        registroId: anterior.id,
        autorId: usuario.id,
      },
      anterior,
      novo,
      CAMPOS_DADOS,
    );
  },
  revalidar: caminho,
});

export const adicionarParticipante = acaoDoProjeto({
  schema: participanteSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    await reuniaoEditavel(tx, dados.projetoId, dados.reuniaoId);
    let registro: Prisma.ParticipanteReuniaoUncheckedCreateInput;
    let nome: string;
    if (dados.origem.startsWith("m:")) {
      const membro = await tx.membroProjeto.findFirst({
        where: { id: dados.origem.slice(2), projetoId: dados.projetoId },
        select: { id: true, usuario: { select: { nome: true } } },
      });
      if (!membro) throw new ErroNegocio("Membro não encontrado neste projeto.");
      registro = { reuniaoId: dados.reuniaoId, parte: "CONTRATADA", membroId: membro.id };
      nome = membro.usuario.nome;
    } else if (dados.origem.startsWith("p:")) {
      const pessoa = await tx.pessoaCliente.findFirst({
        where: { id: dados.origem.slice(2), projetoId: dados.projetoId },
        select: { id: true, nome: true },
      });
      if (!pessoa) throw new ErroNegocio("Pessoa não encontrada neste projeto.");
      registro = { reuniaoId: dados.reuniaoId, parte: "CONTRATANTE", pessoaClienteId: pessoa.id };
      nome = pessoa.nome;
    } else {
      registro = { reuniaoId: dados.reuniaoId, parte: dados.parte, nomeAvulso: dados.nomeAvulso };
      nome = dados.nomeAvulso ?? "";
    }
    const mesmo: Prisma.ParticipanteReuniaoWhereInput = registro.membroId
      ? { membroId: registro.membroId }
      : registro.pessoaClienteId
        ? { pessoaClienteId: registro.pessoaClienteId }
        : { nomeAvulso: { equals: registro.nomeAvulso ?? "", mode: "insensitive" } };
    const repetido = await tx.participanteReuniao.findFirst({
      where: { reuniaoId: dados.reuniaoId, ...mesmo },
      select: { id: true },
    });
    if (repetido) throw new ErroNegocio(`${nome} já está na lista de participantes.`);
    const p = await tx.participanteReuniao.create({ data: registro });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Reuniao",
      registroId: dados.reuniaoId,
      acao: "ATUALIZAR",
      campo: "participantes",
      valorNovo: `${nome} (${p.parte === "CONTRATADA" ? "Contratada" : "Contratante"})`,
      autorId: usuario.id,
    });
  },
  revalidar: caminho,
});

export const removerParticipante = acaoDoProjeto({
  schema: removerParticipanteSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    await reuniaoEditavel(tx, dados.projetoId, dados.reuniaoId);
    const p = await tx.participanteReuniao.findFirst({
      where: { id: dados.participanteId, reuniaoId: dados.reuniaoId },
      include: {
        membro: { select: { usuario: { select: { nome: true } } } },
        pessoa: { select: { nome: true } },
      },
    });
    if (!p) throw new ErroNegocio("Participante não encontrado.");
    await tx.participanteReuniao.delete({ where: { id: p.id } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Reuniao",
      registroId: dados.reuniaoId,
      acao: "ATUALIZAR",
      campo: "participantes",
      valorAnterior: p.membro?.usuario.nome ?? p.pessoa?.nome ?? p.nomeAvulso,
      valorNovo: null,
      autorId: usuario.id,
    });
  },
  revalidar: caminho,
});

/** Cria ou edita decisão; novas recebem o próximo número da reunião. */
export const salvarDecisao = acaoDoProjeto({
  schema: decisaoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    await reuniaoEditavel(tx, dados.projetoId, dados.reuniaoId);
    if (dados.decisaoId) {
      const anterior = await tx.decisao.findFirst({
        where: { id: dados.decisaoId, reuniaoId: dados.reuniaoId },
      });
      if (!anterior) throw new ErroNegocio("Decisão não encontrada.");
      await tx.decisao.update({ where: { id: anterior.id }, data: { texto: dados.texto } });
      await registrarHistorico(tx, {
        projetoId: dados.projetoId,
        entidade: "Reuniao",
        registroId: dados.reuniaoId,
        acao: "ATUALIZAR",
        campo: `decisão ${anterior.numero}`,
        valorAnterior: anterior.texto,
        valorNovo: dados.texto,
        autorId: usuario.id,
      });
      return;
    }
    const existentes = await tx.decisao.findMany({
      where: { reuniaoId: dados.reuniaoId },
      select: { numero: true },
    });
    const numero = proximoNumero(existentes.map((d) => d.numero));
    await tx.decisao.create({ data: { reuniaoId: dados.reuniaoId, numero, texto: dados.texto } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Reuniao",
      registroId: dados.reuniaoId,
      acao: "ATUALIZAR",
      campo: `decisão ${numero}`,
      valorNovo: dados.texto,
      autorId: usuario.id,
    });
  },
  revalidar: caminho,
});

export const excluirDecisao = acaoDoProjeto({
  schema: excluirDecisaoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    await reuniaoEditavel(tx, dados.projetoId, dados.reuniaoId);
    const alvo = await tx.decisao.findFirst({
      where: { id: dados.decisaoId, reuniaoId: dados.reuniaoId },
    });
    if (!alvo) throw new ErroNegocio("Decisão não encontrada.");
    await tx.decisao.delete({ where: { id: alvo.id } });
    // Renumera (1, 2, 3…) em duas etapas para não colidir com o @@unique([reuniaoId, numero]).
    const restantes = await tx.decisao.findMany({ where: { reuniaoId: dados.reuniaoId } });
    for (const d of restantes)
      await tx.decisao.update({ where: { id: d.id }, data: { numero: d.numero + 10_000 } });
    for (const d of renumerar(restantes))
      await tx.decisao.update({ where: { id: d.id }, data: { numero: d.numero } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Reuniao",
      registroId: dados.reuniaoId,
      acao: "ATUALIZAR",
      campo: `decisão ${alvo.numero}`,
      valorAnterior: alvo.texto,
      valorNovo: null,
      autorId: usuario.id,
    });
  },
  revalidar: caminho,
});

/**
 * Finalizar ata (seção 14), só Líder, numa transação:
 * RN07 → percentualNoDia → snapshot → FINALIZADA → histórico.
 * (A geração do PDF e da evidência entra na Sprint 4.)
 */
export const finalizarReuniao = acaoDoProjeto({
  schema: finalizarReuniaoSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    await reuniaoEditavel(tx, dados.projetoId, dados.reuniaoId);
    const ata = await dadosDaAta(tx, dados.projetoId, dados.reuniaoId);
    if (!ata) throw new ErroNegocio("Reunião não encontrada.");

    const erro = validarAcoesDaAta(ata.planoAcao);
    if (erro) throw new ErroNegocio(erro);

    const agora = new Date();
    const snapshot = montarSnapshot(paraSnapshot(ata, agora));
    await tx.reuniao.update({
      where: { id: dados.reuniaoId },
      data: {
        status: "FINALIZADA",
        finalizadaEm: agora,
        percentualNoDia: snapshot.percentualNoDia,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Reuniao",
      registroId: dados.reuniaoId,
      acao: "ATUALIZAR",
      campo: "status",
      valorAnterior: "RASCUNHO",
      valorNovo: "FINALIZADA",
      autorId: usuario.id,
    });
    return { percentualNoDia: snapshot.percentualNoDia };
  },
  revalidar: caminho,
});
