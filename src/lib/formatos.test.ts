import { describe, expect, it } from "vitest";
import { formatarData, formatarDataHora, formatarNumero, hojeISO } from "./formatos";

describe("formatos", () => {
  it("data sem hora em dd/MM/yyyy, sem deslocar o dia pelo fuso", () => {
    expect(formatarData("2026-10-05")).toBe("05/10/2026");
    expect(formatarData(new Date("2026-10-05T00:00:00.000Z"))).toBe("05/10/2026");
    expect(formatarData(null)).toBe("—");
  });

  it("data e hora no fuso America/Sao_Paulo", () => {
    expect(formatarDataHora(new Date("2026-10-05T02:30:00.000Z"))).toBe("04/10/2026 23:30");
  });

  it("hoje no fuso de São Paulo", () => {
    expect(hojeISO(new Date("2026-10-06T01:00:00.000Z"))).toBe("2026-10-05");
  });

  it("números com separador brasileiro", () => {
    expect(formatarNumero(1234567)).toBe("1.234.567");
  });
});
