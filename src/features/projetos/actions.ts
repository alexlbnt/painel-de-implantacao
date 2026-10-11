"use server";

import { redirect } from "next/navigation";
import { isoParaData, isoParaDataOuNulo } from "@/lib/datas";
import { ORDEM_CRITERIOS } from "@/lib/regras/fases";
import { normalizarDepartamentos, validarExclusaoProjeto } from "@/lib/regras/projeto";
import { acaoAutenticada, acaoDoProjeto, ErroNegocio, type Resultado } from "@/server/acao";
import { registrarAlteracoes, registrarHistorico } from "@/server/historico";
import {
  alterarStatusSchema,
  criarProjetoSchema,
  editarProjetoSchema,
  excluirFeriadoSchema,
  excluirProjetoSchema,
  feriadoSchema,
  type ExcluirProjetoInput,
} from "./schemas";

/**
 * RF01: abre a implantação. Na mesma transação (seção 10, notas):
 * o criador vira LIDER e os 4 critérios de check-out são criados.
 */
export const criarProjeto = acaoAutenticada({
  schema: criarProjetoSchema,
  async executar({ tx, dados, usuario }) {
    const departamentos = normalizarDepartamentos(dados.departamentos.map((d) => d.nome));
    const projeto = await tx.projeto.create({
      data: {
        nome: dados.nome,
        cliente: dados.cliente,
        municipio: dados.municipio,
        uf: dados.uf,
        handoffEm: isoParaData(dados.handoffEm),
        inicioPrevisto: isoParaDataOuNulo(dados.inicioPrevisto),
        fimPrevisto: isoParaDataOuNulo(dados.fimPrevisto),
        membros: { create: { usuarioId: usuario.id, papel: "LIDER" } },
        criterios: { create: ORDEM_CRITERIOS.map((tipo) => ({ tipo })) },
        departamentos: { create: departamentos.map((nome) => ({ nome })) },
      },
    });
    await registrarHistorico(tx, {
      projetoId: projeto.id,
      entidade: "Projeto",
      registroId: projeto.id,
      acao: "CRIAR",
      valorNovo: `${projeto.nome} (${projeto.cliente})`,
      autorId: usuario.id,
    });
    return { id: projeto.id };
  },
  revalidar: () => "/projetos",
});

const CAMPOS_EDITAVEIS = [
  "nome",
  "cliente",
  "municipio",
  "uf",
  "handoffEm",
  "inicioPrevisto",
  "fimPrevisto",
  "diaReuniao",
] as const;

export const editarProjeto = acaoDoProjeto({
  schema: editarProjetoSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const anterior = await tx.projeto.findUniqueOrThrow({ where: { id: dados.projetoId } });
    const novo = {
      nome: dados.nome,
      cliente: dados.cliente,
      municipio: dados.municipio,
      uf: dados.uf,
      handoffEm: isoParaData(dados.handoffEm),
      inicioPrevisto: isoParaDataOuNulo(dados.inicioPrevisto),
      fimPrevisto: isoParaDataOuNulo(dados.fimPrevisto),
      diaReuniao: dados.diaReuniao,
    };
    await tx.projeto.update({ where: { id: dados.projetoId }, data: novo });
    await registrarAlteracoes(
      tx,
      {
        projetoId: dados.projetoId,
        entidade: "Projeto",
        registroId: dados.projetoId,
        autorId: usuario.id,
      },
      anterior,
      novo,
      CAMPOS_EDITAVEIS,
    );
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

/** StatusProjeto é independente da fase; alterado pelo Líder, com motivo (seção 4). */
export const alterarStatusProjeto = acaoDoProjeto({
  schema: alterarStatusSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const anterior = await tx.projeto.findUniqueOrThrow({
      where: { id: dados.projetoId },
      select: { status: true },
    });
    if (anterior.status === dados.status)
      throw new ErroNegocio("O projeto já está com esse status.");
    await tx.projeto.update({ where: { id: dados.projetoId }, data: { status: dados.status } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Projeto",
      registroId: dados.projetoId,
      acao: "ATUALIZAR",
      campo: "status",
      valorAnterior: anterior.status,
      valorNovo: dados.status,
      motivo: dados.motivo,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

const excluirProjetoInterno = acaoDoProjeto({
  schema: excluirProjetoSchema,
  permissao: "lider",
  async executar({ tx, dados }) {
    const projeto = await tx.projeto.findUniqueOrThrow({
      where: { id: dados.projetoId },
      select: { fase: true, nome: true },
    });
    const erro = validarExclusaoProjeto(projeto.fase, projeto.nome, dados.confirmacao);
    if (erro) throw new ErroNegocio(erro);
    // O histórico do projeto é apagado em cascata junto com ele (ver docs/DECISOES.md).
    await tx.projeto.delete({ where: { id: dados.projetoId } });
  },
  revalidar: () => "/projetos",
});

/** Exclui (só em PLANEJAMENTO, digitando o nome) e volta para a lista. */
export async function excluirProjeto(input: ExcluirProjetoInput): Promise<Resultado> {
  const r = await excluirProjetoInterno(input);
  if (!r.ok) return r;
  redirect("/projetos");
}

export const adicionarFeriado = acaoDoProjeto({
  schema: feriadoSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const feriado = await tx.feriado.create({
      data: { projetoId: dados.projetoId, data: isoParaData(dados.data), nome: dados.nome },
    });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Feriado",
      registroId: feriado.id,
      acao: "CRIAR",
      valorNovo: `${dados.data} — ${dados.nome}`,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}/configuracoes`,
});

export const excluirFeriado = acaoDoProjeto({
  schema: excluirFeriadoSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const feriado = await tx.feriado.findFirst({
      where: { id: dados.feriadoId, projetoId: dados.projetoId },
    });
    if (!feriado) throw new ErroNegocio("Feriado não encontrado.");
    await tx.feriado.delete({ where: { id: feriado.id } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Feriado",
      registroId: feriado.id,
      acao: "EXCLUIR",
      valorAnterior: `${feriado.data.toISOString().slice(0, 10)} — ${feriado.nome}`,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}/configuracoes`,
});
