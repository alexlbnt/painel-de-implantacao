import "server-only";
import { dataParaISO, dataParaISOOuNulo } from "@/lib/datas";
import { hojeISO } from "@/lib/formatos";
import { situacaoAbertura } from "@/lib/regras/abertura";
import { calcularPercentualProjeto } from "@/lib/regras/progresso";
import { calcularSaude } from "@/lib/regras/saude";
import { resumoAtrasadas } from "@/lib/regras/tarefas";
import { prisma } from "@/server/db";
import { feriadosDoProjeto } from "../projetos/queries";

/** Tudo que o painel do projeto mostra (seção 11), calculado a partir das regras puras. */
export async function dadosDoPainel(projetoId: string) {
  const hoje = hojeISO();
  const [projeto, modulos, tarefas, impedimentos, feriados] = await Promise.all([
    prisma.projeto.findUniqueOrThrow({ where: { id: projetoId } }),
    prisma.modulo.findMany({
      where: { projetoId },
      select: { nome: true, percentual: true, peso: true },
      orderBy: [{ peso: "desc" }, { nome: "asc" }],
    }),
    prisma.tarefa.findMany({
      where: { projetoId },
      select: { status: true, prazo: true, parteResponsavel: true },
    }),
    prisma.impedimento.findMany({ where: { projetoId }, select: { status: true, abertoEm: true } }),
    feriadosDoProjeto(prisma, projetoId),
  ]);

  const tarefasISO = tarefas.map((t) => ({ ...t, prazo: dataParaISOOuNulo(t.prazo) }));
  const impedimentosISO = impedimentos.map((i) => ({ ...i, abertoEm: dataParaISO(i.abertoEm) }));

  return {
    projeto,
    hoje,
    feriados,
    percentual: calcularPercentualProjeto(modulos),
    modulos: modulos.map((m) => ({ nome: m.nome, percentual: m.percentual })),
    saude: calcularSaude({ tarefas: tarefasISO, impedimentos: impedimentosISO }, hoje, feriados),
    abertura: situacaoAbertura(dataParaISO(projeto.handoffEm), hojeISO(projeto.abertoEm), feriados),
    atrasadas: resumoAtrasadas(tarefasISO, hoje),
    totalTarefas: tarefas.length,
  };
}
