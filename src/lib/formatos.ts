import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { FUSO_HORARIO } from "./constantes";

// Formatos de exibição (RNF09): datas dd/MM/yyyy no fuso America/Sao_Paulo e números pt-BR.

/** Data sem hora ("YYYY-MM-DD" ou Date de coluna @db.Date, meia-noite UTC) → dd/MM/yyyy. */
export function formatarData(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const iso = typeof valor === "string" ? valor.slice(0, 10) : valor.toISOString().slice(0, 10);
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Instante (DateTime) → dd/MM/yyyy HH:mm no fuso de exibição. */
export function formatarDataHora(valor: Date | null | undefined): string {
  if (!valor) return "—";
  return formatInTimeZone(valor, FUSO_HORARIO, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/** "Hoje" no fuso de exibição, como "YYYY-MM-DD" (usado pelas regras de prazo). */
export function hojeISO(agora: Date = new Date()): string {
  return formatInTimeZone(agora, FUSO_HORARIO, "yyyy-MM-dd");
}

const numero = new Intl.NumberFormat("pt-BR");

export function formatarNumero(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "—" : numero.format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${numero.format(valor)}%`;
}
