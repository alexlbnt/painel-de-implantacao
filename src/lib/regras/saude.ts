// Saúde do projeto (seção 6), calculada. Limiares nas constantes abaixo.
import { diasUteisEntre, type DataISO } from "./diasUteis";

/** Impedimento ABERTO há MAIS de N dias úteis torna o projeto crítico. */
export const LIMITE_DIAS_UTEIS_IMPEDIMENTO_CRITICO = 10;
/** N ou mais tarefas atrasadas da CONTRATADA tornam o projeto crítico. */
export const LIMITE_TAREFAS_ATRASADAS_CONTRATADA = 5;

export type Saude = "EM_DIA" | "ATENCAO" | "CRITICO";

export type TarefaSaude = {
  status: "A_FAZER" | "EM_ANDAMENTO" | "BLOQUEADA" | "CONCLUIDA";
  prazo: DataISO | null;
  parteResponsavel: "CONTRATADA" | "CONTRATANTE";
};

export type ImpedimentoSaude = { status: "ABERTO" | "RESOLVIDO"; abertoEm: DataISO };

/** Tarefa atrasada = não concluída e prazo < hoje. */
export function tarefaAtrasada(t: Pick<TarefaSaude, "status" | "prazo">, hoje: DataISO): boolean {
  return t.status !== "CONCLUIDA" && t.prazo !== null && t.prazo < hoje;
}

export function calcularSaude(
  dados: { tarefas: readonly TarefaSaude[]; impedimentos: readonly ImpedimentoSaude[] },
  hoje: DataISO,
  feriados: readonly DataISO[] = [],
): Saude {
  const abertos = dados.impedimentos.filter((i) => i.status === "ABERTO");
  const atrasadas = dados.tarefas.filter((t) => tarefaAtrasada(t, hoje));

  const impedimentoAntigo = abertos.some(
    (i) => diasUteisEntre(i.abertoEm, hoje, feriados) > LIMITE_DIAS_UTEIS_IMPEDIMENTO_CRITICO,
  );
  const atrasadasContratada = atrasadas.filter((t) => t.parteResponsavel === "CONTRATADA").length;
  if (impedimentoAntigo || atrasadasContratada >= LIMITE_TAREFAS_ATRASADAS_CONTRATADA) {
    return "CRITICO";
  }

  if (atrasadas.length > 0 || abertos.length > 0) return "ATENCAO";
  return "EM_DIA";
}
