import { describe, expect, it } from "vitest";
import { diasUteisEntre, ehDiaUtil, feriadosNacionais, pascoa, somarDiasUteis } from "./diasUteis";

describe("pascoa (Meeus/Butcher)", () => {
  it("calcula a Páscoa de 2026 e 2027", () => {
    expect(pascoa(2026)).toBe("2026-04-05");
    expect(pascoa(2027)).toBe("2027-03-28");
  });

  it("calcula anos de referência conhecidos", () => {
    expect(pascoa(2024)).toBe("2024-03-31");
    expect(pascoa(2025)).toBe("2025-04-20");
    expect(pascoa(2038)).toBe("2038-04-25");
  });
});

describe("feriadosNacionais", () => {
  it("inclui a Sexta-feira Santa (Páscoa − 2) e as datas fixas", () => {
    const f2026 = feriadosNacionais(2026);
    expect(f2026).toContain("2026-04-03");
    expect(feriadosNacionais(2027)).toContain("2027-03-26");
    for (const md of [
      "01-01",
      "04-21",
      "05-01",
      "09-07",
      "10-12",
      "11-02",
      "11-15",
      "11-20",
      "12-25",
    ]) {
      expect(f2026).toContain(`2026-${md}`);
    }
    expect(f2026).toHaveLength(10);
  });
});

describe("ehDiaUtil", () => {
  it("segunda a sexta são úteis", () => {
    expect(ehDiaUtil("2026-10-05")).toBe(true); // segunda
    expect(ehDiaUtil("2026-10-09")).toBe(true); // sexta
  });
  it("sábado e domingo não são úteis", () => {
    expect(ehDiaUtil("2026-10-10")).toBe(false);
    expect(ehDiaUtil("2026-10-11")).toBe(false);
  });
  it("feriado nacional não é útil", () => {
    expect(ehDiaUtil("2026-04-03")).toBe(false); // Sexta-feira Santa
    expect(ehDiaUtil("2026-04-21")).toBe(false); // Tiradentes, terça
  });
  it("feriado municipal informado não é útil", () => {
    expect(ehDiaUtil("2026-10-06", ["2026-10-06"])).toBe(false);
  });
  it("recusa data em formato inválido", () => {
    expect(() => ehDiaUtil("06/10/2026")).toThrow();
  });
});

describe("somarDiasUteis", () => {
  it("prazo que atravessa feriado nacional", () => {
    // segunda 20/04/2026 + 2: terça 21/04 é feriado → quarta 22 (1), quinta 23 (2)
    expect(somarDiasUteis("2026-04-20", 2)).toBe("2026-04-23");
  });
  it("prazo que atravessa fim de semana", () => {
    // quinta 01/10/2026 + 2: sexta 02 (1), segunda 05 (2)
    expect(somarDiasUteis("2026-10-01", 2)).toBe("2026-10-05");
  });
  it("a partir de sexta-feira cai na segunda", () => {
    expect(somarDiasUteis("2026-10-02", 1)).toBe("2026-10-05");
  });
  it("a partir de sexta-feira com feriado na segunda (12/10)", () => {
    expect(somarDiasUteis("2026-10-09", 1)).toBe("2026-10-13");
  });
  it("feriado municipal empurra o prazo", () => {
    expect(somarDiasUteis("2026-10-05", 1, ["2026-10-06"])).toBe("2026-10-07");
  });
  it("n = 0 devolve a própria data", () => {
    expect(somarDiasUteis("2026-10-10", 0)).toBe("2026-10-10");
  });
  it("aceita n negativo (volta no calendário)", () => {
    expect(somarDiasUteis("2026-10-05", -1)).toBe("2026-10-02");
  });
  it("atravessa a virada do ano", () => {
    // quarta 30/12/2026 + 2: quinta 31 (1), sexta 01/01 feriado, segunda 04/01 (2)
    expect(somarDiasUteis("2026-12-30", 2)).toBe("2027-01-04");
  });
});

describe("diasUteisEntre", () => {
  it("conta dias úteis depois de a até b, inclusive", () => {
    expect(diasUteisEntre("2026-10-01", "2026-10-05")).toBe(2);
    expect(diasUteisEntre("2026-04-20", "2026-04-23")).toBe(2);
  });
  it("é zero para a mesma data", () => {
    expect(diasUteisEntre("2026-10-05", "2026-10-05")).toBe(0);
  });
  it("é negativo quando b é anterior a a", () => {
    expect(diasUteisEntre("2026-10-05", "2026-10-01")).toBe(-2);
  });
  it("considera feriados municipais", () => {
    expect(diasUteisEntre("2026-10-05", "2026-10-09", ["2026-10-06"])).toBe(3);
  });
  it("é o inverso de somarDiasUteis", () => {
    const fim = somarDiasUteis("2026-11-13", 7, ["2026-11-17"]);
    expect(diasUteisEntre("2026-11-13", fim, ["2026-11-17"])).toBe(7);
  });
});
