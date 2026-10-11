"use server";

import { isoParaData } from "@/lib/datas";
import { hojeISO, LABEL_CATEGORIA_IMPEDIMENTO } from "@/lib/formatos";
import { validarEdicaoReuniao } from "@/lib/regras/reunioes";
import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import { registrarHistorico } from "@/server/historico";
import { abrirImpedimentoSchema, resolverImpedimentoSchema } from "./schemas";

/** RF11: impedimento separado de risco, com categoria e parte responsável. */
export const abrirImpedimento = acaoDoProjeto({
  schema: abrirImpedimentoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    if (dados.reuniaoId) {
      const reuniao = await tx.reuniao.findFirst({
        where: { id: dados.reuniaoId, projetoId: dados.projetoId },
        select: { status: true },
      });
      if (!reuniao) throw new ErroNegocio("Reunião não encontrada.");
      const erro = validarEdicaoReuniao(reuniao.status);
      if (erro) throw new ErroNegocio(erro);
    }
    const imp = await tx.impedimento.create({
      data: {
        projetoId: dados.projetoId,
        reuniaoId: dados.reuniaoId ?? null,
        categoria: dados.categoria,
        descricao: dados.descricao,
        parteResponsavel: dados.parteResponsavel,
        abertoEm: isoParaData(hojeISO()),
      },
    });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Impedimento",
      registroId: imp.id,
      acao: "CRIAR",
      valorNovo: `${LABEL_CATEGORIA_IMPEDIMENTO[dados.categoria]}: ${dados.descricao}`,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});

export const resolverImpedimento = acaoDoProjeto({
  schema: resolverImpedimentoSchema,
  permissao: "membro",
  async executar({ tx, dados, usuario }) {
    const imp = await tx.impedimento.findFirst({
      where: { id: dados.impedimentoId, projetoId: dados.projetoId },
    });
    if (!imp) throw new ErroNegocio("Impedimento não encontrado.");
    if (imp.status === "RESOLVIDO") throw new ErroNegocio("Este impedimento já foi resolvido.");
    await tx.impedimento.update({
      where: { id: imp.id },
      data: {
        status: "RESOLVIDO",
        resolvidoEm: isoParaData(hojeISO()),
        resolucao: dados.resolucao,
      },
    });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId,
      entidade: "Impedimento",
      registroId: imp.id,
      acao: "ATUALIZAR",
      campo: "status",
      valorAnterior: "ABERTO",
      valorNovo: "RESOLVIDO",
      motivo: dados.resolucao,
      autorId: usuario.id,
    });
  },
  revalidar: (d) => `/projetos/${d.projetoId}`,
});
