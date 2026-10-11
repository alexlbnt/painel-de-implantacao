import "server-only";
import { notFound } from "next/navigation";
import { dataParaISO, dataParaISOOuNulo } from "@/lib/datas";
import { calcularPercentualProjeto } from "@/lib/regras/progresso";
import type { DadosSnapshot, SnapshotAta } from "@/lib/regras/reunioes";
import { prisma, type Tx } from "@/server/db";

type Leitor = Tx | typeof prisma;

const incluirResponsavel = {
  responsavelMembro: { select: { usuario: { select: { nome: true } } } },
  responsavelPessoa: { select: { nome: true } },
} as const;

type ComResponsavel = {
  responsavelMembro: { usuario: { nome: string } } | null;
  responsavelPessoa: { nome: string } | null;
};
const nomeResponsavel = (t: ComResponsavel) =>
  t.responsavelMembro?.usuario.nome ?? t.responsavelPessoa?.nome ?? null;

export async function listarReunioes(projetoId: string) {
  return prisma.reuniao.findMany({
    where: { projetoId },
    select: { id: true, numero: true, tipo: true, data: true, status: true, finalizadaEm: true },
    orderBy: { numero: "desc" },
  });
}

export async function listarImpedimentos(projetoId: string) {
  const itens = await prisma.impedimento.findMany({
    where: { projetoId },
    include: { reuniao: { select: { numero: true } } },
    orderBy: [{ status: "asc" }, { abertoEm: "asc" }],
  });
  return itens.map((i) => ({
    id: i.id,
    categoria: i.categoria,
    descricao: i.descricao,
    parteResponsavel: i.parteResponsavel,
    status: i.status,
    abertoEm: dataParaISO(i.abertoEm),
    resolvidoEm: dataParaISOOuNulo(i.resolvidoEm),
    resolucao: i.resolucao,
    reuniaoNumero: i.reuniao?.numero ?? null,
    reuniaoId: i.reuniaoId,
  }));
}
export type ImpedimentoDaLista = Awaited<ReturnType<typeof listarImpedimentos>>[number];

/**
 * Dados vivos da ata (rascunho). Usados pela tela e, na finalização, pelo snapshot —
 * assim o que se vê no rascunho é exatamente o que fica congelado.
 */
export async function dadosDaAta(db: Leitor, projetoId: string, reuniaoId: string) {
  const reuniao = await db.reuniao.findFirst({
    where: { id: reuniaoId, projetoId },
    include: {
      projeto: { select: { nome: true, cliente: true, municipio: true, uf: true } },
      participantes: {
        include: {
          membro: { select: { usuario: { select: { nome: true } } } },
          pessoa: { select: { nome: true } },
        },
      },
      decisoes: { orderBy: { numero: "asc" } },
      acoes: { include: incluirResponsavel, orderBy: [{ criadoEm: "asc" }] },
    },
  });
  if (!reuniao) return null;

  const [anterior, impedimentos, modulos] = await Promise.all([
    db.reuniao.findFirst({
      where: { projetoId, numero: { lt: reuniao.numero } },
      orderBy: { numero: "desc" },
      select: {
        id: true,
        numero: true,
        acoes: { include: incluirResponsavel, orderBy: { criadoEm: "asc" } },
      },
    }),
    // Pontos críticos: impedimentos abertos + os registrados nesta reunião (mesmo se já resolvidos).
    db.impedimento.findMany({
      where: { projetoId, OR: [{ status: "ABERTO" }, { reuniaoId }] },
      orderBy: { abertoEm: "asc" },
    }),
    db.modulo.findMany({ where: { projetoId }, select: { percentual: true, peso: true } }),
  ]);

  return {
    reuniao,
    percentualAtual: calcularPercentualProjeto(modulos),
    participantes: reuniao.participantes.map((p) => ({
      id: p.id,
      parte: p.parte,
      nome: p.membro?.usuario.nome ?? p.pessoa?.nome ?? p.nomeAvulso ?? "—",
      membroId: p.membroId,
      pessoaClienteId: p.pessoaClienteId,
    })),
    decisoes: reuniao.decisoes.map((d) => ({ id: d.id, numero: d.numero, texto: d.texto })),
    planoAcao: reuniao.acoes.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      responsavel: nomeResponsavel(t),
      prazo: dataParaISOOuNulo(t.prazo),
      parteResponsavel: t.parteResponsavel,
      status: t.status,
    })),
    acoesAnteriores: {
      reuniaoId: anterior?.id ?? null,
      reuniaoNumero: anterior?.numero ?? null,
      itens: (anterior?.acoes ?? []).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        responsavel: nomeResponsavel(t),
        prazo: dataParaISOOuNulo(t.prazo),
        status: t.status,
      })),
    },
    impedimentos: impedimentos.map((i) => ({
      id: i.id,
      categoria: i.categoria,
      descricao: i.descricao,
      parteResponsavel: i.parteResponsavel,
      abertoEm: dataParaISO(i.abertoEm),
      status: i.status,
      resolucao: i.resolucao,
    })),
  };
}

export type DadosDaAta = NonNullable<Awaited<ReturnType<typeof dadosDaAta>>>;

/** Converte os dados vivos no formato de entrada do snapshot (seção 14, "Finalizar ata"). */
export function paraSnapshot(d: DadosDaAta, finalizadaEm: Date): DadosSnapshot {
  const r = d.reuniao;
  return {
    cabecalho: {
      tipo: r.tipo,
      numero: r.numero,
      data: dataParaISO(r.data),
      horaInicio: r.horaInicio,
      horaFim: r.horaFim,
      local: r.local,
      projeto: r.projeto,
    },
    participantes: d.participantes.map((p) => ({ parte: p.parte, nome: p.nome })),
    percentualNoDia: d.percentualAtual,
    resumoStatus: r.resumoStatus,
    acoesAnteriores: {
      reuniaoNumero: d.acoesAnteriores.reuniaoNumero,
      itens: d.acoesAnteriores.itens.map(({ titulo, responsavel, prazo, status }) => ({
        titulo,
        responsavel,
        prazo,
        status,
      })),
    },
    impedimentos: d.impedimentos.map(
      ({ categoria, descricao, parteResponsavel, abertoEm, status, resolucao }) => ({
        categoria,
        descricao,
        parteResponsavel,
        abertoEm,
        status,
        resolucao,
      }),
    ),
    decisoes: d.decisoes.map(({ numero, texto }) => ({ numero, texto })),
    planoAcao: d.planoAcao.map(({ titulo, responsavel, prazo, parteResponsavel }) => ({
      titulo,
      responsavel,
      prazo,
      parteResponsavel,
    })),
    salvaguardas: r.salvaguardas,
    finalizadaEm,
  };
}

/** Ata para a página: rascunho (dados vivos) ou finalizada (só o snapshot). 404 se não existir. */
export async function obterAta(projetoId: string, reuniaoId: string) {
  const dados = await dadosDaAta(prisma, projetoId, reuniaoId);
  if (!dados) notFound();
  const snapshot =
    dados.reuniao.status === "FINALIZADA"
      ? (dados.reuniao.snapshot as unknown as SnapshotAta | null)
      : null;
  return { ...dados, snapshot };
}

/** Opções para adicionar participantes: equipe (contratada) e pessoas do cliente (contratante). */
export async function opcoesParticipantes(projetoId: string) {
  const [membros, pessoas] = await Promise.all([
    prisma.membroProjeto.findMany({
      where: { projetoId },
      select: { id: true, usuario: { select: { nome: true } } },
      orderBy: { usuario: { nome: "asc" } },
    }),
    prisma.pessoaCliente.findMany({
      where: { projetoId },
      select: { id: true, nome: true, cargo: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  return {
    equipe: membros.map((m) => ({ valor: `m:${m.id}`, rotulo: m.usuario.nome })),
    cliente: pessoas.map((p) => ({
      valor: `p:${p.id}`,
      rotulo: p.cargo ? `${p.nome} — ${p.cargo}` : p.nome,
    })),
  };
}
