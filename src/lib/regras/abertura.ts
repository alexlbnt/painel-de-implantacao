// RN03 / RF01: o projeto deve ser aberto em até 48 horas úteis após o handoff.
// prazoAbertura = handoffEm + 2 dias úteis; abertoEm = data de criação do projeto.
import { diasUteisEntre, somarDiasUteis, type DataISO } from "./diasUteis";

export const DIAS_UTEIS_PARA_ABERTURA = 2;

export type SituacaoAbertura = {
  prazo: DataISO;
  noPrazo: boolean;
  /** Dias úteis de atraso (0 quando no prazo). */
  diasAtraso: number;
};

export function situacaoAbertura(
  handoffEm: DataISO,
  abertoEm: DataISO,
  feriados: readonly DataISO[] = [],
): SituacaoAbertura {
  const prazo = somarDiasUteis(handoffEm, DIAS_UTEIS_PARA_ABERTURA, feriados);
  if (abertoEm <= prazo) return { prazo, noPrazo: true, diasAtraso: 0 };
  return { prazo, noPrazo: false, diasAtraso: diasUteisEntre(prazo, abertoEm, feriados) };
}

export function descreverAbertura(s: SituacaoAbertura): string {
  if (s.noPrazo) return "Aberto no prazo";
  return s.diasAtraso === 1
    ? "Aberto com 1 dia útil de atraso"
    : `Aberto com ${s.diasAtraso} dias úteis de atraso`;
}
