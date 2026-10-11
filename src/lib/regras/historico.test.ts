import { describe, expect, it } from "vitest";
import { diferencas, normalizarValor } from "./historico";

describe("normalizarValor", () => {
  it("converte datas para ISO e undefined para null", () => {
    expect(normalizarValor(new Date("2026-10-05T00:00:00.000Z"))).toBe("2026-10-05T00:00:00.000Z");
    expect(normalizarValor(undefined)).toBeNull();
    expect(normalizarValor(null)).toBeNull();
    expect(normalizarValor(3)).toBe(3);
  });
});

describe("diferencas", () => {
  const anterior = { nome: "Projeto A", diaReuniao: 4, fimPrevisto: null as Date | null };

  it("gera uma linha por campo alterado", () => {
    const r = diferencas(anterior, { nome: "Projeto B", diaReuniao: 2 }, [
      "nome",
      "diaReuniao",
      "fimPrevisto",
    ]);
    expect(r).toEqual([
      { campo: "nome", valorAnterior: "Projeto A", valorNovo: "Projeto B" },
      { campo: "diaReuniao", valorAnterior: 4, valorNovo: 2 },
    ]);
  });

  it("ignora campos iguais e campos não enviados", () => {
    expect(diferencas(anterior, { nome: "Projeto A" }, ["nome", "diaReuniao"])).toEqual([]);
  });

  it("ignora campos fora da lista", () => {
    expect(diferencas(anterior, { nome: "X" }, ["diaReuniao"])).toEqual([]);
  });

  it("compara datas pelo valor", () => {
    const a: { fim: Date | null } = { fim: new Date("2026-12-01T00:00:00Z") };
    expect(diferencas(a, { fim: new Date("2026-12-01T00:00:00Z") }, ["fim"])).toEqual([]);
    expect(diferencas(a, { fim: null }, ["fim"])).toEqual([
      { campo: "fim", valorAnterior: "2026-12-01T00:00:00.000Z", valorNovo: null },
    ]);
  });
});
