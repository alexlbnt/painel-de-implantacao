// Regras das tarefas (RF04, RN11) e do quadro.
import type { DataISO } from "./diasUteis";
import { MOTIVO_MIN_CARACTERES } from "./fases";
import { tarefaAtrasada } from "./saude";

export const STATUS_TAREFA = ["A_FAZER", "EM_ANDAMENTO", "BLOQUEADA", "CONCLUIDA"] as const;
export type StatusTarefaRegra = (typeof STATUS_TAREFA)[number];
export type ParteRegra = "CONTRATADA" | "CONTRATANTE";

/** RN11: tarefa bloqueada exige motivo (mesmo mínimo dos demais motivos — ver DECISOES D20). */
export function validarBloqueio(
  status: StatusTarefaRegra,
  motivo: string | null | undefined,
): string | null {
  if (status !== "BLOQUEADA") return null;
  return (motivo ?? "").trim().length >= MOTIVO_MIN_CARACTERES
    ? null
    : `Para bloquear, explique o motivo com pelo menos ${MOTIVO_MIN_CARACTERES} caracteres.`;
}

/**
 * Campos que mudam junto com o status:
 * - motivoBloqueio só existe enquanto BLOQUEADA;
 * - concluidaEm é gravado ao concluir e limpo ao reabrir.
 */
export function camposDoStatus(
  anterior: { status: StatusTarefaRegra; concluidaEm: Date | null },
  novo: StatusTarefaRegra,
  motivo: string | null | undefined,
  agora: Date,
): { status: StatusTarefaRegra; motivoBloqueio: string | null; concluidaEm: Date | null } {
  return {
    status: novo,
    motivoBloqueio: novo === "BLOQUEADA" ? (motivo ?? "").trim() : null,
    concluidaEm:
      novo === "CONCLUIDA"
        ? anterior.status === "CONCLUIDA"
          ? anterior.concluidaEm
          : agora
        : null,
  };
}

/** Nova ordem de uma coluna do quadro com `id` inserido em `indice` (remove de onde estiver). */
export function reposicionar(ids: readonly string[], id: string, indice: number): string[] {
  const sem = ids.filter((x) => x !== id);
  const i = Math.max(0, Math.min(indice, sem.length));
  return [...sem.slice(0, i), id, ...sem.slice(i)];
}

// ---------- responsável: membro da equipe (contratada) ou pessoa do cliente ----------

export type Responsavel = { membroId: string | null; pessoaId: string | null };

/** Valor único do <select> de responsável: "m:<id>", "p:<id>" ou "". */
export function codificarResponsavel(r: Responsavel): string {
  if (r.membroId) return `m:${r.membroId}`;
  if (r.pessoaId) return `p:${r.pessoaId}`;
  return "";
}

export function decodificarResponsavel(valor: string | null | undefined): Responsavel {
  if (valor?.startsWith("m:") && valor.length > 2)
    return { membroId: valor.slice(2), pessoaId: null };
  if (valor?.startsWith("p:") && valor.length > 2)
    return { membroId: null, pessoaId: valor.slice(2) };
  return { membroId: null, pessoaId: null };
}

// ---------- filtros da lista e indicadores ----------

export type TarefaFiltravel = {
  status: StatusTarefaRegra;
  prazo: DataISO | null;
  parteResponsavel: ParteRegra;
  moduloId: string | null;
  departamentoId: string | null;
  responsavelMembroId: string | null;
  responsavelPessoaId: string | null;
};

export type FiltrosTarefa = {
  moduloId?: string;
  departamentoId?: string;
  responsavel?: string; // "m:<id>" | "p:<id>"
  parte?: ParteRegra;
  atrasadas?: boolean;
};

export function filtrarTarefas<T extends TarefaFiltravel>(
  tarefas: readonly T[],
  filtros: FiltrosTarefa,
  hoje: DataISO,
): T[] {
  const resp = filtros.responsavel ? decodificarResponsavel(filtros.responsavel) : null;
  return tarefas.filter(
    (t) =>
      (!filtros.moduloId || t.moduloId === filtros.moduloId) &&
      (!filtros.departamentoId || t.departamentoId === filtros.departamentoId) &&
      (!filtros.parte || t.parteResponsavel === filtros.parte) &&
      (!resp ||
        (resp.membroId !== null && t.responsavelMembroId === resp.membroId) ||
        (resp.pessoaId !== null && t.responsavelPessoaId === resp.pessoaId)) &&
      (!filtros.atrasadas || tarefaAtrasada(t, hoje)),
  );
}

/** Card "Tarefas atrasadas" do painel: total e divisão Contratada × Contratante. */
export function resumoAtrasadas(
  tarefas: readonly Pick<TarefaFiltravel, "status" | "prazo" | "parteResponsavel">[],
  hoje: DataISO,
): { total: number; contratada: number; contratante: number } {
  const atrasadas = tarefas.filter((t) => tarefaAtrasada(t, hoje));
  const contratada = atrasadas.filter((t) => t.parteResponsavel === "CONTRATADA").length;
  return { total: atrasadas.length, contratada, contratante: atrasadas.length - contratada };
}
