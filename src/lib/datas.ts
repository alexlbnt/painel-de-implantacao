import type { DataISO } from "./regras/diasUteis";

// Conversões entre colunas @db.Date (Date à meia-noite UTC) e strings "YYYY-MM-DD".

export function dataParaISO(data: Date): DataISO {
  return data.toISOString().slice(0, 10);
}

export function dataParaISOOuNulo(data: Date | null | undefined): DataISO | null {
  return data ? dataParaISO(data) : null;
}

export function isoParaData(iso: DataISO): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function isoParaDataOuNulo(iso: DataISO | null | undefined): Date | null {
  return iso ? isoParaData(iso) : null;
}
