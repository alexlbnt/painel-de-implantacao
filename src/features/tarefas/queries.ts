import "server-only";
import { dataParaISOOuNulo } from "@/lib/datas";
import { codificarResponsavel } from "@/lib/regras/tarefas";
import { prisma } from "@/server/db";

/** Tarefas do projeto prontas para o quadro e a lista (datas como "YYYY-MM-DD"). */
export async function listarTarefas(projetoId: string) {
  const tarefas = await prisma.tarefa.findMany({
    where: { projetoId },
    include: {
      modulo: { select: { nome: true } },
      departamento: { select: { nome: true } },
      responsavelMembro: { select: { usuario: { select: { nome: true } } } },
      responsavelPessoa: { select: { nome: true } },
      reuniaoOrigem: { select: { numero: true } },
    },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
  return tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    status: t.status,
    prioridade: t.prioridade,
    parteResponsavel: t.parteResponsavel,
    motivoBloqueio: t.motivoBloqueio,
    prazo: dataParaISOOuNulo(t.prazo),
    ordem: t.ordem,
    moduloId: t.moduloId,
    modulo: t.modulo?.nome ?? null,
    departamentoId: t.departamentoId,
    departamento: t.departamento?.nome ?? null,
    responsavelMembroId: t.responsavelMembroId,
    responsavelPessoaId: t.responsavelPessoaId,
    responsavel: codificarResponsavel({
      membroId: t.responsavelMembroId,
      pessoaId: t.responsavelPessoaId,
    }),
    responsavelNome: t.responsavelMembro?.usuario.nome ?? t.responsavelPessoa?.nome ?? null,
    reuniaoNumero: t.reuniaoOrigem?.numero ?? null,
  }));
}

export type TarefaDaLista = Awaited<ReturnType<typeof listarTarefas>>[number];

/** Opções dos selects de tarefa: módulos, departamentos e responsáveis (equipe + cliente). */
export async function opcoesTarefa(projetoId: string) {
  const [modulos, departamentos, membros, pessoas] = await Promise.all([
    prisma.modulo.findMany({
      where: { projetoId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.departamento.findMany({
      where: { projetoId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.membroProjeto.findMany({
      where: { projetoId },
      select: { id: true, usuario: { select: { nome: true } } },
      orderBy: { usuario: { nome: "asc" } },
    }),
    prisma.pessoaCliente.findMany({
      where: { projetoId },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  return {
    modulos: modulos.map((m) => ({ valor: m.id, rotulo: m.nome })),
    departamentos: departamentos.map((d) => ({ valor: d.id, rotulo: d.nome })),
    responsaveis: {
      equipe: membros.map((m) => ({ valor: `m:${m.id}`, rotulo: m.usuario.nome })),
      cliente: pessoas.map((p) => ({ valor: `p:${p.id}`, rotulo: p.nome })),
    },
  };
}

export type OpcoesTarefa = Awaited<ReturnType<typeof opcoesTarefa>>;
