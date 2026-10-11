"use server";

import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import { registrarAlteracoes, registrarHistorico } from "@/server/historico";
import { excluirModuloSchema, moduloSchema } from "./schemas";

const CAMPOS = ["nome", "status", "percentual", "aderencia", "peso", "observacao"] as const;

/** Cria ou edita um módulo (RF03). Líder e Analista (seção 3). */
export const salvarModulo = acaoDoProjeto({
  schema: moduloSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const campos = {
      nome: dados.nome.replace(/\s+/g, " "),
      status: dados.status,
      percentual: dados.percentual,
      aderencia: dados.aderencia,
      peso: dados.peso,
      observacao: dados.observacao,
    };
    const repetido = await tx.modulo.findFirst({
      where: {
        projetoId: dados.projetoId,
        nome: { equals: campos.nome, mode: "insensitive" },
        NOT: dados.moduloId ? { id: dados.moduloId } : undefined,
      },
      select: { id: true },
    });
    if (repetido) throw new ErroNegocio("Já existe um módulo com esse nome neste projeto.");

    if (!dados.moduloId) {
      const modulo = await tx.modulo.create({ data: { projetoId: dados.projetoId, ...campos } });
      await registrarHistorico(tx, {
        projetoId: dados.projetoId,
        entidade: "Modulo",
        registroId: modulo.id,
        acao: "CRIAR",
        valorNovo: `${modulo.nome} (${modulo.percentual}%, peso ${modulo.peso})`,
        autorId: usuario.id,
      });
      return { id: modulo.id };
    }

    const anterior = await tx.modulo.findFirst({
      where: { id: dados.moduloId, projetoId: dados.projetoId },
    });
    if (!anterior) throw new ErroNegocio("Módulo não encontrado.");
    await tx.modulo.update({ where: { id: anterior.id }, data: campos });
    await registrarAlteracoes(
      tx,
      {
        projetoId: dados.projetoId,
        entidade: "Modulo",
        registroId: anterior.id,
        autorId: usuario.id,
      },
      anterior,
      campos,
      CAMPOS,
    );
    return { id: anterior.id };
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

export const excluirModulo = acaoDoProjeto({
  schema: excluirModuloSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const modulo = await tx.modulo.findFirst({
      where: { id: dados.moduloId, projetoId: dados.projetoId },
      select: { id: true, nome: true },
    });
    if (!modulo) throw new ErroNegocio("Módulo não encontrado.");
    // Tarefas e treinamentos do módulo ficam sem módulo (onDelete: SetNull).
    await tx.modulo.delete({ where: { id: modulo.id } });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Modulo",
      registroId: modulo.id,
      acao: "EXCLUIR",
      valorAnterior: modulo.nome,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});
