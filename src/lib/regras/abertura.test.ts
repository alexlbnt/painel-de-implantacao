import { describe, expect, it } from "vitest";
import { descreverAbertura, situacaoAbertura } from "./abertura";

describe("situacaoAbertura (RN03)", () => {
  it("prazo = handoff + 2 dias úteis", () => {
    // quinta 01/10/2026 → sexta 02 (1), segunda 05 (2)
    expect(situacaoAbertura("2026-10-01", "2026-10-01").prazo).toBe("2026-10-05");
  });

  it("aberto no próprio dia ou até o prazo está no prazo", () => {
    expect(situacaoAbertura("2026-10-01", "2026-10-01")).toMatchObject({
      noPrazo: true,
      diasAtraso: 0,
    });
    expect(situacaoAbertura("2026-10-01", "2026-10-05")).toMatchObject({
      noPrazo: true,
      diasAtraso: 0,
    });
  });

  it("conta o atraso em dias úteis", () => {
    // prazo segunda 05/10; aberto quarta 07/10 → 2 dias úteis de atraso
    expect(situacaoAbertura("2026-10-01", "2026-10-07")).toMatchObject({
      noPrazo: false,
      diasAtraso: 2,
    });
  });

  it("considera feriados nacionais e municipais", () => {
    // sexta 09/10 + 2: segunda 12/10 é feriado → terça 13 (1), quarta 14 (2)
    expect(situacaoAbertura("2026-10-09", "2026-10-14").noPrazo).toBe(true);
    // com feriado municipal na quarta 14 → prazo quinta 15
    expect(situacaoAbertura("2026-10-09", "2026-10-15", ["2026-10-14"])).toMatchObject({
      prazo: "2026-10-15",
      noPrazo: true,
    });
  });

  it("descreve a situação em português", () => {
    expect(descreverAbertura({ prazo: "2026-10-05", noPrazo: true, diasAtraso: 0 })).toBe(
      "Aberto no prazo",
    );
    expect(descreverAbertura({ prazo: "2026-10-05", noPrazo: false, diasAtraso: 1 })).toBe(
      "Aberto com 1 dia útil de atraso",
    );
    expect(descreverAbertura({ prazo: "2026-10-05", noPrazo: false, diasAtraso: 3 })).toBe(
      "Aberto com 3 dias úteis de atraso",
    );
  });
});
