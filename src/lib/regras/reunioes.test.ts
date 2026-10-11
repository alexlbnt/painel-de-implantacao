import { describe, expect, it } from "vitest";
import {
  diaDaSemana,
  montarSnapshot,
  proximaDataReuniao,
  proximoNumero,
  renumerar,
  rotuloDecisao,
  validarAcoesDaAta,
  validarEdicaoReuniao,
  validarResolucaoImpedimento,
  type DadosSnapshot,
} from "./reunioes";

describe("proximaDataReuniao (A7)", () => {
  it("sugere o próximo dia configurado", () => {
    // 2026-10-12 é segunda; quinta (4) → 15/10
    expect(diaDaSemana("2026-10-12")).toBe(1);
    expect(proximaDataReuniao("2026-10-12", 4)).toBe("2026-10-15");
  });
  it("hoje, se hoje já é o dia", () => {
    expect(proximaDataReuniao("2026-10-15", 4)).toBe("2026-10-15");
  });
  it("vira a semana quando o dia já passou", () => {
    // sexta 16/10 → quinta 22/10; sábado 17/10 → segunda 19/10
    expect(proximaDataReuniao("2026-10-16", 4)).toBe("2026-10-22");
    expect(proximaDataReuniao("2026-10-17", 1)).toBe("2026-10-19");
  });
  it("recusa dia fora de segunda a sexta", () => {
    expect(() => proximaDataReuniao("2026-10-12", 6)).toThrow();
  });
});

describe("proximoNumero", () => {
  it("é o maior + 1, para todos os tipos", () => {
    expect(proximoNumero([])).toBe(1);
    expect(proximoNumero([1, 2, 3])).toBe(4);
    expect(proximoNumero([3, 1])).toBe(4);
  });
});

describe("validarEdicaoReuniao (RN08)", () => {
  it("ata finalizada não muda", () => {
    expect(validarEdicaoReuniao("FINALIZADA")).toMatch(/finalizada/);
    expect(validarEdicaoReuniao("RASCUNHO")).toBeNull();
  });
});

describe("validarAcoesDaAta (RN07)", () => {
  it("exige responsável e prazo em toda ação", () => {
    expect(validarAcoesDaAta([])).toBeNull();
    expect(
      validarAcoesDaAta([{ titulo: "A", responsavel: "Ana", prazo: "2026-10-20" }]),
    ).toBeNull();
    const erro = validarAcoesDaAta([
      { titulo: "A", responsavel: null, prazo: "2026-10-20" },
      { titulo: "B", responsavel: "Ana", prazo: null },
      { titulo: "C", responsavel: "Ana", prazo: "2026-10-20" },
    ]);
    expect(erro).toContain('"A"');
    expect(erro).toContain('"B"');
    expect(erro).not.toContain('"C"');
  });
});

describe("decisões", () => {
  it("rótulo com dois dígitos", () => {
    expect(rotuloDecisao(1)).toBe("Decisão 01");
    expect(rotuloDecisao(12)).toBe("Decisão 12");
  });
  it("renumera mantendo a ordem", () => {
    expect(
      renumerar([
        { numero: 3, t: "c" },
        { numero: 1, t: "a" },
      ]).map((d) => [d.numero, d.t]),
    ).toEqual([
      [1, "a"],
      [2, "c"],
    ]);
  });
});

describe("validarResolucaoImpedimento", () => {
  it("exige descrição da resolução", () => {
    expect(validarResolucaoImpedimento("")).not.toBeNull();
    expect(validarResolucaoImpedimento("Cliente liberou o acesso")).toBeNull();
  });
});

describe("montarSnapshot", () => {
  const base: DadosSnapshot = {
    cabecalho: {
      tipo: "SEMANAL",
      numero: 4,
      data: "2026-10-15",
      horaInicio: "09:00",
      horaFim: "10:00",
      local: "Sala de reuniões",
      projeto: { nome: "P", cliente: "C", municipio: "M", uf: "MG" },
    },
    participantes: [
      { parte: "CONTRATANTE", nome: "Zélia" },
      { parte: "CONTRATADA", nome: "Bruno" },
      { parte: "CONTRATANTE", nome: "Ana Paula" },
    ],
    percentualNoDia: 52,
    resumoStatus: "Resumo",
    acoesAnteriores: { reuniaoNumero: 3, itens: [] },
    impedimentos: [],
    decisoes: [
      { numero: 2, texto: "Segunda" },
      { numero: 5, texto: "Terceira" },
      { numero: 1, texto: "Primeira" },
    ],
    planoAcao: [],
    salvaguardas: null,
    finalizadaEm: new Date("2026-10-15T13:00:00Z"),
  };

  it("separa participantes por parte, em ordem alfabética", () => {
    const s = montarSnapshot(base);
    expect(s.participantes).toEqual({ contratada: ["Bruno"], contratante: ["Ana Paula", "Zélia"] });
  });

  it("congela decisões renumeradas e o percentual do dia", () => {
    const s = montarSnapshot(base);
    expect(s.decisoes).toEqual([
      { numero: 1, texto: "Primeira" },
      { numero: 2, texto: "Segunda" },
      { numero: 3, texto: "Terceira" },
    ]);
    expect(s.percentualNoDia).toBe(52);
    expect(s.versao).toBe(1);
    expect(s.finalizadaEm).toBe("2026-10-15T13:00:00.000Z");
  });

  it("é serializável como JSON sem perdas", () => {
    const s = montarSnapshot(base);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
