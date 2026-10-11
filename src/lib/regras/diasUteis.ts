// Dias úteis (RNF02, seção 6). Funções puras sobre datas sem hora no formato "YYYY-MM-DD".
// Dia útil = segunda a sexta, exceto feriados nacionais (calculados aqui) e feriados
// extras/municipais passados em `feriados` (vêm da tabela Feriado).

export type DataISO = string; // "YYYY-MM-DD"

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;
const UM_DIA_MS = 86_400_000;

/** Feriados nacionais de data fixa (mês-dia). */
export const FERIADOS_FIXOS = [
  "01-01", // Confraternização Universal
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "09-07", // Independência
  "10-12", // Nossa Senhora Aparecida
  "11-02", // Finados
  "11-15", // Proclamação da República
  "11-20", // Dia Nacional de Zumbi e da Consciência Negra
  "12-25", // Natal
] as const;

function paraUtc(data: DataISO): number {
  const m = FORMATO.exec(data);
  if (!m) throw new Error(`Data inválida: "${data}". Use o formato AAAA-MM-DD.`);
  const [, a, mes, d] = m;
  const ms = Date.UTC(Number(a), Number(mes) - 1, Number(d));
  if (new Date(ms).toISOString().slice(0, 10) !== data) {
    throw new Error(`Data inexistente: "${data}".`);
  }
  return ms;
}

function deUtc(ms: number): DataISO {
  return new Date(ms).toISOString().slice(0, 10);
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/** Domingo de Páscoa pelo algoritmo de Meeus/Butcher (calendário gregoriano). */
export function pascoa(ano: number): DataISO {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`;
}

const cacheNacionais = new Map<number, readonly DataISO[]>();

/** Feriados nacionais do ano, incluindo a Sexta-feira Santa (Páscoa − 2). */
export function feriadosNacionais(ano: number): readonly DataISO[] {
  const existente = cacheNacionais.get(ano);
  if (existente) return existente;
  const sextaSanta = deUtc(paraUtc(pascoa(ano)) - 2 * UM_DIA_MS);
  const lista = [...FERIADOS_FIXOS.map((md) => `${ano}-${md}`), sextaSanta].sort();
  cacheNacionais.set(ano, lista);
  return lista;
}

function ehFimDeSemana(ms: number): boolean {
  const dia = new Date(ms).getUTCDay();
  return dia === 0 || dia === 6;
}

export function ehDiaUtil(data: DataISO, feriados: readonly DataISO[] = []): boolean {
  const ms = paraUtc(data);
  if (ehFimDeSemana(ms)) return false;
  const ano = Number(data.slice(0, 4));
  if (feriadosNacionais(ano).includes(data)) return false;
  return !feriados.includes(data);
}

/**
 * Soma `n` dias úteis a `data` (n negativo volta no calendário).
 * O dia de partida não conta; n = 0 devolve a própria data.
 */
export function somarDiasUteis(
  data: DataISO,
  n: number,
  feriados: readonly DataISO[] = [],
): DataISO {
  if (!Number.isInteger(n)) throw new Error("A quantidade de dias úteis precisa ser inteira.");
  let ms = paraUtc(data);
  const passo = n >= 0 ? UM_DIA_MS : -UM_DIA_MS;
  let restantes = Math.abs(n);
  while (restantes > 0) {
    ms += passo;
    if (ehDiaUtil(deUtc(ms), feriados)) restantes--;
  }
  return deUtc(ms);
}

/**
 * Dias úteis depois de `a` até `b`, inclusive (`a` não conta).
 * Negativo quando `b` é anterior a `a`. Inverso de `somarDiasUteis`.
 */
export function diasUteisEntre(a: DataISO, b: DataISO, feriados: readonly DataISO[] = []): number {
  const inicio = paraUtc(a);
  const fim = paraUtc(b);
  if (inicio === fim) return 0;
  const sinal = fim > inicio ? 1 : -1;
  const [de, ate] = sinal === 1 ? [inicio, fim] : [fim, inicio];
  let total = 0;
  for (let ms = de + UM_DIA_MS; ms <= ate; ms += UM_DIA_MS) {
    if (ehDiaUtil(deUtc(ms), feriados)) total++;
  }
  return total * sinal;
}
