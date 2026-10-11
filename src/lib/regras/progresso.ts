// Percentual do projeto (RN10, decisão A9): calculado, nunca digitado.
// Σ(percentual × peso) / Σ(peso), arredondado para inteiro; 0 se não houver módulos.

export type ModuloProgresso = { percentual: number; peso: number };

export function calcularPercentualProjeto(modulos: readonly ModuloProgresso[]): number {
  let somaPesos = 0;
  let somaPonderada = 0;
  for (const { percentual, peso } of modulos) {
    somaPesos += peso;
    somaPonderada += percentual * peso;
  }
  if (somaPesos <= 0) return 0;
  return Math.round(somaPonderada / somaPesos);
}
