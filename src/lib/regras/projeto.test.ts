import { describe, expect, it } from "vitest";
import { normalizarDepartamentos, validarExclusaoProjeto } from "./projeto";

describe("validarExclusaoProjeto", () => {
  it("só exclui em PLANEJAMENTO", () => {
    expect(validarExclusaoProjeto("EXECUCAO", "Projeto X", "Projeto X")).toMatch(/Planejamento/);
  });
  it("exige digitar o nome exato", () => {
    expect(validarExclusaoProjeto("PLANEJAMENTO", "Projeto X", "projeto x")).toMatch(/exatamente/);
    expect(validarExclusaoProjeto("PLANEJAMENTO", "Projeto X", " Projeto X ")).toBeNull();
  });
});

describe("normalizarDepartamentos", () => {
  it("remove vazios, espaços extras e repetidos", () => {
    expect(
      normalizarDepartamentos([" Compras ", "", "compras", "Recursos  Humanos", "  "]),
    ).toEqual(["Compras", "Recursos Humanos"]);
  });
});
