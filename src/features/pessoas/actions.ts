"use server";

import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import { registrarAlteracoes, registrarHistorico } from "@/server/historico";
import {
  departamentoSchema,
  excluirDepartamentoSchema,
  excluirPessoaSchema,
  pessoaSchema,
} from "./schemas";

const CAMPOS_PESSOA = ["nome", "cargo", "departamento", "email", "telefone"] as const;

/** Cria ou edita uma pessoa do cliente (Líder e Analista — seção 3). */
export const salvarPessoa = acaoDoProjeto({
  schema: pessoaSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    let nomeDepartamento: string | null = null;
    if (dados.departamentoId) {
      const dep = await tx.departamento.findFirst({
        where: { id: dados.departamentoId, projetoId: dados.projetoId },
        select: { nome: true },
      });
      if (!dep) throw new ErroNegocio("Departamento não encontrado neste projeto.");
      nomeDepartamento = dep.nome;
    }
    const campos = {
      nome: dados.nome,
      cargo: dados.cargo,
      departamentoId: dados.departamentoId,
      email: dados.email,
      telefone: dados.telefone,
    };

    if (!dados.pessoaId) {
      const pessoa = await tx.pessoaCliente.create({
        data: { projetoId: dados.projetoId, ...campos },
      });
      await registrarHistorico(tx, {
        projetoId: dados.projetoId,
        entidade: "PessoaCliente",
        registroId: pessoa.id,
        acao: "CRIAR",
        valorNovo: pessoa.nome,
        autorId: usuario.id,
      });
      return;
    }

    const anterior = await tx.pessoaCliente.findFirst({
      where: { id: dados.pessoaId, projetoId: dados.projetoId },
      include: { departamento: { select: { nome: true } } },
    });
    if (!anterior) throw new ErroNegocio("Pessoa não encontrada.");
    await tx.pessoaCliente.update({ where: { id: anterior.id }, data: campos });
    // No histórico, o departamento aparece pelo nome (não pelo id).
    await registrarAlteracoes(
      tx,
      {
        projetoId: dados.projetoId,
        entidade: "PessoaCliente",
        registroId: anterior.id,
        autorId: usuario.id,
      },
      { ...anterior, departamento: anterior.departamento?.nome ?? null },
      { ...campos, departamento: nomeDepartamento },
      CAMPOS_PESSOA,
    );
  },
  revalidar: (d) => `/projetos/${d.projetoId}/pessoas`,
});

export const excluirPessoa = acaoDoProjeto({
  schema: excluirPessoaSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const pessoa = await tx.pessoaCliente.findFirst({
      where: { id: dados.pessoaId, projetoId: dados.projetoId },
      select: { id: true, nome: true, _count: { select: { tentativas: true } } },
    });
    if (!pessoa) throw new ErroNegocio("Pessoa não encontrada.");
    if (pessoa._count.tentativas > 0) {
      throw new ErroNegocio(
        "Esta pessoa é destinatária de tentativas de formalização registradas e não pode ser excluída.",
      );
    }
    await tx.pessoaCliente.delete({ where: { id: pessoa.id } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "PessoaCliente",
      registroId: pessoa.id,
      acao: "EXCLUIR",
      valorAnterior: pessoa.nome,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}/pessoas`,
});

export const salvarDepartamento = acaoDoProjeto({
  schema: departamentoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const nome = dados.nome.replace(/\s+/g, " ");
    const repetido = await tx.departamento.findFirst({
      where: {
        projetoId: dados.projetoId,
        nome: { equals: nome, mode: "insensitive" },
        NOT: dados.departamentoId ? { id: dados.departamentoId } : undefined,
      },
      select: { id: true },
    });
    if (repetido) throw new ErroNegocio("Já existe um departamento com esse nome.");

    if (!dados.departamentoId) {
      const dep = await tx.departamento.create({ data: { projetoId: dados.projetoId, nome } });
      await registrarHistorico(tx, {
        projetoId: dados.projetoId,
        entidade: "Departamento",
        registroId: dep.id,
        acao: "CRIAR",
        valorNovo: nome,
        autorId: usuario.id,
      });
      return;
    }

    const anterior = await tx.departamento.findFirst({
      where: { id: dados.departamentoId, projetoId: dados.projetoId },
    });
    if (!anterior) throw new ErroNegocio("Departamento não encontrado.");
    await tx.departamento.update({ where: { id: anterior.id }, data: { nome } });
    await registrarAlteracoes(
      tx,
      {
        projetoId: dados.projetoId,
        entidade: "Departamento",
        registroId: anterior.id,
        autorId: usuario.id,
      },
      anterior,
      { nome },
      ["nome"],
    );
  },
  revalidar: (d) => `/projetos/${d.projetoId}/pessoas`,
});

export const excluirDepartamento = acaoDoProjeto({
  schema: excluirDepartamentoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const dep = await tx.departamento.findFirst({
      where: { id: dados.departamentoId, projetoId: dados.projetoId },
      select: { id: true, nome: true },
    });
    if (!dep) throw new ErroNegocio("Departamento não encontrado.");
    // Pessoas, tarefas e itens de migração ficam sem departamento (onDelete: SetNull).
    await tx.departamento.delete({ where: { id: dep.id } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Departamento",
      registroId: dep.id,
      acao: "EXCLUIR",
      valorAnterior: dep.nome,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}/pessoas`,
});
