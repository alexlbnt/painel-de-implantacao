import { describe, expect, it } from "vitest";
import { validarMudancaPapel, validarRemocaoMembro, type MembroEquipe } from "./equipe";

const umLider: MembroEquipe[] = [
  { id: "l1", papel: "LIDER" },
  { id: "a1", papel: "ANALISTA" },
];
const doisLideres: MembroEquipe[] = [...umLider, { id: "l2", papel: "LIDER" }];

describe("validarRemocaoMembro", () => {
  it("permite remover Analista", () => {
    expect(validarRemocaoMembro(umLider, "a1")).toBeNull();
  });
  it("recusa remover o último Líder", () => {
    expect(validarRemocaoMembro(umLider, "l1")).toMatch(/pelo menos um Líder/);
  });
  it("permite remover um Líder quando há outro", () => {
    expect(validarRemocaoMembro(doisLideres, "l1")).toBeNull();
  });
  it("membro inexistente", () => {
    expect(validarRemocaoMembro(umLider, "x")).toBe("Membro não encontrado.");
  });
});

describe("validarMudancaPapel", () => {
  it("recusa rebaixar o último Líder", () => {
    expect(validarMudancaPapel(umLider, "l1", "ANALISTA")).toMatch(/pelo menos um Líder/);
  });
  it("permite rebaixar um Líder quando há outro", () => {
    expect(validarMudancaPapel(doisLideres, "l2", "ANALISTA")).toBeNull();
  });
  it("permite promover Analista e manter o mesmo papel", () => {
    expect(validarMudancaPapel(umLider, "a1", "LIDER")).toBeNull();
    expect(validarMudancaPapel(umLider, "l1", "LIDER")).toBeNull();
  });
});
