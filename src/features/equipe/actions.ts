"use server";

import { validarMudancaPapel, validarRemocaoMembro } from "@/lib/regras/equipe";
import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import type { Tx } from "@/server/db";
import { registrarHistorico } from "@/server/historico";
import { adicionarMembroSchema, mudarPapelSchema, removerMembroSchema } from "./schemas";

async function membrosDoProjeto(tx: Tx, projetoId: string) {
  return tx.membroProjeto.findMany({
    where: { projetoId },
    select: { id: true, papel: true, usuario: { select: { nome: true, email: true } } },
  });
}

/** Adiciona por e-mail de usuário já cadastrado (sem convites por e-mail — seção 19). */
export const adicionarMembro = acaoDoProjeto({
  schema: adicionarMembroSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const alvo = await tx.usuario.findUnique({
      where: { email: dados.email },
      select: { id: true, nome: true },
    });
    if (!alvo) {
      throw new ErroNegocio(
        "Não encontramos uma conta com esse e-mail. Peça para a pessoa criar a conta e tente de novo.",
      );
    }
    const existente = await tx.membroProjeto.findUnique({
      where: { projetoId_usuarioId: { projetoId: dados.projetoId, usuarioId: alvo.id } },
    });
    if (existente) throw new ErroNegocio(`${alvo.nome} já faz parte da equipe.`);

    const membro = await tx.membroProjeto.create({
      data: { projetoId: dados.projetoId, usuarioId: alvo.id, papel: dados.papel },
    });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "MembroProjeto",
      registroId: membro.id,
      acao: "CRIAR",
      valorNovo: `${alvo.nome} (${dados.papel})`,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

export const mudarPapel = acaoDoProjeto({
  schema: mudarPapelSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const membros = await membrosDoProjeto(tx, dados.projetoId);
    const alvo = membros.find((m) => m.id === dados.membroId);
    if (!alvo) throw new ErroNegocio("Membro não encontrado.");
    const erro = validarMudancaPapel(membros, dados.membroId, dados.papel);
    if (erro) throw new ErroNegocio(erro);
    if (alvo.papel === dados.papel) return;

    await tx.membroProjeto.update({ where: { id: alvo.id }, data: { papel: dados.papel } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "MembroProjeto",
      registroId: alvo.id,
      acao: "ATUALIZAR",
      campo: `papel de ${alvo.usuario.nome}`,
      valorAnterior: alvo.papel,
      valorNovo: dados.papel,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

export const removerMembro = acaoDoProjeto({
  schema: removerMembroSchema,
  permissao: "lider",
  async executar({ tx, dados, usuario }) {
    const membros = await membrosDoProjeto(tx, dados.projetoId);
    const alvo = membros.find((m) => m.id === dados.membroId);
    if (!alvo) throw new ErroNegocio("Membro não encontrado.");
    const erro = validarRemocaoMembro(membros, dados.membroId);
    if (erro) throw new ErroNegocio(erro);

    await tx.membroProjeto.delete({ where: { id: alvo.id } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "MembroProjeto",
      registroId: alvo.id,
      acao: "EXCLUIR",
      valorAnterior: `${alvo.usuario.nome} (${alvo.papel})`,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});
