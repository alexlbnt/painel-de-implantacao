import { describe, expect, it } from "vitest";
import { formatarValorHistorico, nomeDoCampo } from "./formatar";

describe("formatarValorHistorico", () => {
  it("traduz enums e datas", () => {
    expect(formatarValorHistorico("EXECUCAO")).toBe("Execução");
    expect(formatarValorHistorico("ACEITE_TACITO")).toBe("Aceite tácito");
    expect(formatarValorHistorico("2026-10-05")).toBe("05/10/2026");
    expect(formatarValorHistorico("2026-10-05T00:00:00.000Z")).toBe("05/10/2026");
  });
  it("trata vazios, booleanos e texto livre", () => {
    expect(formatarValorHistorico(null)).toBe("—");
    expect(formatarValorHistorico(true)).toBe("Sim");
    expect(formatarValorHistorico("Texto qualquer")).toBe("Texto qualquer");
  });
  it("dá nome aos campos conhecidos", () => {
    expect(nomeDoCampo("handoffEm")).toBe("Handoff");
    expect(nomeDoCampo("outro")).toBe("outro");
    expect(nomeDoCampo(null)).toBeNull();
  });
});
