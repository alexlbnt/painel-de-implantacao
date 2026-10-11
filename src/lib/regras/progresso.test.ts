import { describe, expect, it } from "vitest";
import { calcularPercentualProjeto } from "./progresso";

describe("calcularPercentualProjeto (RN10)", () => {
  it("sem módulos = 0", () => {
    expect(calcularPercentualProjeto([])).toBe(0);
  });

  it("média ponderada pelo peso", () => {
    // Módulos do seed: (80×3 + 60×3 + 40×2 + 20×1 + 0×1) / 10 = 52
    expect(
      calcularPercentualProjeto([
        { percentual: 80, peso: 3 },
        { percentual: 60, peso: 3 },
        { percentual: 40, peso: 2 },
        { percentual: 20, peso: 1 },
        { percentual: 0, peso: 1 },
      ]),
    ).toBe(52);
  });

  it("peso maior puxa a média", () => {
    expect(
      calcularPercentualProjeto([
        { percentual: 100, peso: 9 },
        { percentual: 0, peso: 1 },
      ]),
    ).toBe(90);
  });

  it("arredonda para o inteiro mais próximo", () => {
    expect(
      calcularPercentualProjeto([
        { percentual: 33, peso: 2 },
        { percentual: 34, peso: 1 },
      ]),
    ).toBe(33); // 33,33
    expect(
      calcularPercentualProjeto([
        { percentual: 66, peso: 1 },
        { percentual: 67, peso: 2 },
      ]),
    ).toBe(67); // 66,67
    expect(
      calcularPercentualProjeto([
        { percentual: 50, peso: 1 },
        { percentual: 51, peso: 1 },
      ]),
    ).toBe(51); // 50,5
  });

  it("um único módulo devolve o próprio percentual", () => {
    expect(calcularPercentualProjeto([{ percentual: 42, peso: 5 }])).toBe(42);
  });
});
