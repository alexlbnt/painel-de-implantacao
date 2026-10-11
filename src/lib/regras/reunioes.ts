// Reunião semanal e ata (RF09, RF10, RN07, RN08, A7, A10).
import { somarDiasCorridos, type DataISO } from "./diasUteis";

export type TipoReuniaoRegra = "KICKOFF" | "SEMANAL" | "PRONTIDAO";
export type StatusReuniaoRegra = "RASCUNHO" | "FINALIZADA";
export type ParteAta = "CONTRATADA" | "CONTRATANTE";

/** Dia da semana (1 = segunda … 5 = sexta) de uma data "YYYY-MM-DD"; 0 = domingo, 6 = sábado. */
export function diaDaSemana(data: DataISO): number {
  return new Date(`${data}T00:00:00.000Z`).getUTCDay();
}

/** A7: próxima data no dia configurado (hoje, se hoje já for o dia). */
export function proximaDataReuniao(hoje: DataISO, diaReuniao: number): DataISO {
  if (diaReuniao < 1 || diaReuniao > 5)
    throw new Error("Dia da reunião deve ser de 1 (segunda) a 5 (sexta).");
  const delta = (diaReuniao - diaDaSemana(hoje) + 7) % 7;
  return somarDiasCorridos(hoje, delta);
}

/** Número sequencial por projeto, para todos os tipos: maior + 1. */
export function proximoNumero(numeros: readonly number[]): number {
  return numeros.length === 0 ? 1 : Math.max(...numeros) + 1;
}

/** RN08: ata finalizada não muda. */
export function validarEdicaoReuniao(status: StatusReuniaoRegra): string | null {
  return status === "FINALIZADA"
    ? "Esta ata já foi finalizada e não pode mais ser alterada."
    : null;
}

export type AcaoAta = {
  titulo: string;
  responsavel: string | null;
  prazo: DataISO | null;
};

/** RN07: toda ação de ata tem responsável e prazo. Devolve a mensagem de recusa ou null. */
export function validarAcoesDaAta(acoes: readonly AcaoAta[]): string | null {
  const incompletas = acoes.filter((a) => !a.responsavel || !a.prazo);
  if (incompletas.length === 0) return null;
  const lista = incompletas.map((a) => `"${a.titulo}"`).join(", ");
  return `Toda ação da ata precisa de responsável e prazo. Complete: ${lista}.`;
}

/** Decisões numeradas "Decisão 01", "Decisão 02"… */
export function rotuloDecisao(numero: number): string {
  return `Decisão ${String(numero).padStart(2, "0")}`;
}

/** Renumera decisões após uma exclusão, mantendo a ordem (1, 2, 3…). */
export function renumerar<T extends { numero: number }>(
  itens: readonly T[],
): (T & { numero: number })[] {
  return [...itens].sort((a, b) => a.numero - b.numero).map((d, i) => ({ ...d, numero: i + 1 }));
}

// ---------- snapshot congelado da ata (RN08) ----------

export type SnapshotAta = {
  versao: 1;
  cabecalho: {
    tipo: TipoReuniaoRegra;
    numero: number;
    data: DataISO;
    horaInicio: string | null;
    horaFim: string | null;
    local: string | null;
    projeto: { nome: string; cliente: string; municipio: string; uf: string };
  };
  participantes: { contratada: string[]; contratante: string[] };
  percentualNoDia: number;
  resumoStatus: string | null;
  acoesAnteriores: {
    reuniaoNumero: number | null;
    itens: { titulo: string; responsavel: string | null; prazo: DataISO | null; status: string }[];
  };
  impedimentos: {
    categoria: string;
    descricao: string;
    parteResponsavel: ParteAta;
    abertoEm: DataISO;
    status: string;
    resolucao: string | null;
  }[];
  decisoes: { numero: number; texto: string }[];
  planoAcao: {
    titulo: string;
    responsavel: string | null;
    prazo: DataISO | null;
    parteResponsavel: ParteAta;
  }[];
  salvaguardas: string | null;
  finalizadaEm: string;
};

export type DadosSnapshot = Omit<
  SnapshotAta,
  "versao" | "participantes" | "decisoes" | "finalizadaEm"
> & {
  participantes: { parte: ParteAta; nome: string }[];
  decisoes: { numero: number; texto: string }[];
  finalizadaEm: Date;
};

/** Monta o conteúdo congelado da ata no momento da finalização. */
export function montarSnapshot(d: DadosSnapshot): SnapshotAta {
  const nomes = (parte: ParteAta) =>
    d.participantes
      .filter((p) => p.parte === parte)
      .map((p) => p.nome)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  return {
    versao: 1,
    cabecalho: d.cabecalho,
    participantes: { contratada: nomes("CONTRATADA"), contratante: nomes("CONTRATANTE") },
    percentualNoDia: d.percentualNoDia,
    resumoStatus: d.resumoStatus,
    acoesAnteriores: d.acoesAnteriores,
    impedimentos: d.impedimentos,
    decisoes: renumerar(d.decisoes).map(({ numero, texto }) => ({ numero, texto })),
    planoAcao: d.planoAcao,
    salvaguardas: d.salvaguardas,
    finalizadaEm: d.finalizadaEm.toISOString(),
  };
}

/** RF11: impedimento resolvido precisa da resolução descrita. */
export function validarResolucaoImpedimento(resolucao: string | null | undefined): string | null {
  return (resolucao ?? "").trim().length >= 10
    ? null
    : "Descreva como o impedimento foi resolvido (mínimo 10 caracteres).";
}
