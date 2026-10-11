import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { dataParaISO, dataParaISOOuNulo } from "@/lib/datas";
import { hojeISO } from "@/lib/formatos";
import { situacaoAbertura } from "@/lib/regras/abertura";
import type { DataISO } from "@/lib/regras/diasUteis";
import { itensDoPortao, proximaFase, type DadosPortao } from "@/lib/regras/fases";
import { calcularPercentualProjeto } from "@/lib/regras/progresso";
import { calcularSaude } from "@/lib/regras/saude";
import { prisma, type Tx } from "@/server/db";

type Leitor = Tx | typeof prisma;

/** Feriados extras do projeto + globais (projetoId nulo), como "YYYY-MM-DD". */
export async function feriadosDoProjeto(db: Leitor, projetoId: string): Promise<DataISO[]> {
  const feriados = await db.feriado.findMany({
    where: { OR: [{ projetoId }, { projetoId: null }] },
    select: { data: true },
  });
  return feriados.map((f) => dataParaISO(f.data));
}

/** Tudo que os portões de fase precisam saber sobre o projeto (seção 4). */
export async function dadosDoPortao(
  db: Leitor,
  projetoId: string,
  hoje: DataISO = hojeISO(),
): Promise<DadosPortao> {
  const [projeto, evidencias, totalModulos, criterios, prontidao] = await Promise.all([
    db.projeto.findUniqueOrThrow({ where: { id: projetoId }, select: { dataProntidao: true } }),
    db.evidencia.findMany({ where: { projetoId }, select: { tipo: true, statusAssinatura: true } }),
    db.modulo.count({ where: { projetoId } }),
    db.criterioCheckout.findMany({ where: { projetoId }, select: { tipo: true, atendido: true } }),
    db.reuniao.count({ where: { projetoId, tipo: "PRONTIDAO", status: "FINALIZADA" } }),
  ]);
  return {
    evidencias,
    totalModulos,
    criterios,
    reuniaoProntidaoFinalizada: prontidao > 0,
    dataProntidao: dataParaISOOuNulo(projeto.dataProntidao),
    hoje,
  };
}

/** Indicadores calculados que aparecem no card do projeto e no painel. */
export async function indicadoresDoProjeto(
  db: Leitor,
  projetoId: string,
  hoje: DataISO = hojeISO(),
) {
  const [modulos, tarefas, impedimentos, feriados] = await Promise.all([
    db.modulo.findMany({ where: { projetoId }, select: { percentual: true, peso: true } }),
    db.tarefa.findMany({
      where: { projetoId },
      select: { status: true, prazo: true, parteResponsavel: true },
    }),
    db.impedimento.findMany({ where: { projetoId }, select: { status: true, abertoEm: true } }),
    feriadosDoProjeto(db, projetoId),
  ]);
  const saude = calcularSaude(
    {
      tarefas: tarefas.map((t) => ({ ...t, prazo: dataParaISOOuNulo(t.prazo) })),
      impedimentos: impedimentos.map((i) => ({ ...i, abertoEm: dataParaISO(i.abertoEm) })),
    },
    hoje,
    feriados,
  );
  return { percentual: calcularPercentualProjeto(modulos), saude, feriados };
}

/** Projeto do layout (cabeçalho e navegação). Deduplicado por requisição. */
export const obterProjeto = cache(async (projetoId: string) => {
  const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
  if (!projeto) notFound();
  return projeto;
});

/** Situação de abertura (RN03) do projeto. */
export function aberturaDoProjeto(
  projeto: { handoffEm: Date; abertoEm: Date },
  feriados: readonly DataISO[],
) {
  return situacaoAbertura(dataParaISO(projeto.handoffEm), hojeISO(projeto.abertoEm), feriados);
}

/** Projetos dos quais o usuário é membro, com os dados dos cards de /projetos. */
export async function listarProjetosDoUsuario(usuarioId: string) {
  const membros = await prisma.membroProjeto.findMany({
    where: { usuarioId },
    select: {
      papel: true,
      projeto: {
        select: {
          id: true,
          nome: true,
          cliente: true,
          municipio: true,
          uf: true,
          fase: true,
          status: true,
        },
      },
    },
    orderBy: { projeto: { atualizadoEm: "desc" } },
  });

  const hoje = hojeISO();
  return Promise.all(
    membros.map(async ({ papel, projeto }) => {
      const [indicadores, portao] = await Promise.all([
        indicadoresDoProjeto(prisma, projeto.id, hoje),
        dadosDoPortao(prisma, projeto.id, hoje),
      ]);
      const destino = proximaFase(projeto.fase);
      const pendentes = itensDoPortao(projeto.fase, portao).filter((i) => !i.atendido).length;
      return {
        ...projeto,
        papel,
        percentual: indicadores.percentual,
        saude: indicadores.saude,
        proximoMarco: destino ? { fase: destino, pendentes } : null,
      };
    }),
  );
}

export type ProjetoDaLista = Awaited<ReturnType<typeof listarProjetosDoUsuario>>[number];
