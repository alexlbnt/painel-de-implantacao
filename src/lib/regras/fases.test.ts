import { describe, expect, it } from "vitest";
import {
  avaliarAvanco,
  avaliarRetrocesso,
  diasRestantesTransicao,
  faseAnterior,
  FASES,
  itensDoPortao,
  proximaFase,
  validarMotivo,
  type DadosPortao,
} from "./fases";

const base: DadosPortao = {
  evidencias: [],
  totalModulos: 0,
  criterios: [],
  reuniaoProntidaoFinalizada: false,
  dataProntidao: null,
  hoje: "2026-10-20",
};
const dados = (p: Partial<DadosPortao>): DadosPortao => ({ ...base, ...p });

const todosCriterios = (atendido: boolean) =>
  (
    [
      "SALDOS_INICIAIS_ACEITOS",
      "AUTONOMIA_USUARIOS_CHAVE",
      "INTEGRACOES_OBRIGATORIAS_ATIVAS",
      "WIKI_CONSOLIDADA",
    ] as const
  ).map((tipo) => ({ tipo, atendido }));

describe("ordem das fases", () => {
  it("segue PLANEJAMENTO → … → ENCERRADO", () => {
    expect(FASES).toEqual([
      "PLANEJAMENTO",
      "EXECUCAO",
      "CHECKOUT",
      "HANDOVER",
      "TRANSICAO",
      "ENCERRADO",
    ]);
    expect(proximaFase("PLANEJAMENTO")).toBe("EXECUCAO");
    expect(proximaFase("ENCERRADO")).toBeNull();
    expect(faseAnterior("EXECUCAO")).toBe("PLANEJAMENTO");
    expect(faseAnterior("PLANEJAMENTO")).toBeNull();
  });
});

describe("portão PLANEJAMENTO → EXECUCAO (RN04 + RN02)", () => {
  it("recusa sem as evidências de kickoff", () => {
    const r = avaliarAvanco("PLANEJAMENTO", base);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.pendentes).toHaveLength(2);
  });

  it("recusa evidências em RASCUNHO", () => {
    const r = avaliarAvanco(
      "PLANEJAMENTO",
      dados({
        evidencias: [
          { tipo: "ATA_ABERTURA", statusAssinatura: "RASCUNHO" },
          { tipo: "TERMO_DADOS_LEGADOS", statusAssinatura: "ASSINADO" },
        ],
      }),
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.pendentes?.map((p) => p.chave)).toEqual(["ATA_ABERTURA"]);
  });

  it.each(["ENVIADO", "ASSINADO", "RECUSADO", "ACEITE_TACITO"] as const)(
    "aceita evidências com status %s (falta de assinatura não paralisa)",
    (status) => {
      const r = avaliarAvanco(
        "PLANEJAMENTO",
        dados({
          evidencias: [
            { tipo: "ATA_ABERTURA", statusAssinatura: status },
            { tipo: "TERMO_DADOS_LEGADOS", statusAssinatura: status },
          ],
        }),
      );
      expect(r).toEqual({ ok: true, destino: "EXECUCAO" });
    },
  );
});

describe("portão EXECUCAO → CHECKOUT", () => {
  it("exige pelo menos 1 módulo", () => {
    expect(avaliarAvanco("EXECUCAO", base).ok).toBe(false);
    expect(avaliarAvanco("EXECUCAO", dados({ totalModulos: 1 }))).toEqual({
      ok: true,
      destino: "CHECKOUT",
    });
  });
});

describe("portão CHECKOUT → HANDOVER (RN05)", () => {
  it("exige os 4 critérios atendidos", () => {
    expect(avaliarAvanco("CHECKOUT", dados({ criterios: todosCriterios(false) })).ok).toBe(false);
    const tresDeQuatro = todosCriterios(true).map((c, i) =>
      i === 2 ? { ...c, atendido: false } : c,
    );
    const r = avaliarAvanco("CHECKOUT", dados({ criterios: tresDeQuatro }));
    expect(!r.ok && r.pendentes?.map((p) => p.chave)).toEqual(["INTEGRACOES_OBRIGATORIAS_ATIVAS"]);
    expect(avaliarAvanco("CHECKOUT", dados({ criterios: todosCriterios(true) }))).toEqual({
      ok: true,
      destino: "HANDOVER",
    });
  });
});

describe("portão HANDOVER → TRANSICAO", () => {
  it("exige a reunião de prontidão finalizada", () => {
    expect(avaliarAvanco("HANDOVER", base).ok).toBe(false);
    expect(avaliarAvanco("HANDOVER", dados({ reuniaoProntidaoFinalizada: true }))).toEqual({
      ok: true,
      destino: "TRANSICAO",
    });
  });
});

describe("portão TRANSICAO → ENCERRADO (RN06)", () => {
  it("exige 20 dias corridos desde o D+0", () => {
    expect(avaliarAvanco("TRANSICAO", dados({ dataProntidao: null })).ok).toBe(false);
    expect(
      avaliarAvanco("TRANSICAO", dados({ dataProntidao: "2026-10-01", hoje: "2026-10-20" })).ok,
    ).toBe(false);
    expect(
      avaliarAvanco("TRANSICAO", dados({ dataProntidao: "2026-10-01", hoje: "2026-10-21" })),
    ).toEqual({
      ok: true,
      destino: "ENCERRADO",
    });
  });

  it("mostra quantos dias faltam", () => {
    expect(diasRestantesTransicao("2026-10-01", "2026-10-15")).toBe(6);
    expect(diasRestantesTransicao("2026-10-01", "2026-11-30")).toBe(0);
    const [item] = itensDoPortao(
      "TRANSICAO",
      dados({ dataProntidao: "2026-10-01", hoje: "2026-10-15" }),
    );
    expect(item.descricao).toContain("faltam 6");
  });
});

describe("a partir de ENCERRADO", () => {
  it("não avança nem retrocede", () => {
    expect(avaliarAvanco("ENCERRADO", base).ok).toBe(false);
    expect(avaliarRetrocesso("ENCERRADO")).toEqual({
      ok: false,
      erro: "Um projeto encerrado não pode voltar de fase.",
    });
  });
});

describe("retroceder", () => {
  it("volta uma fase", () => {
    expect(avaliarRetrocesso("CHECKOUT")).toEqual({ ok: true, destino: "EXECUCAO" });
    expect(avaliarRetrocesso("TRANSICAO")).toEqual({ ok: true, destino: "HANDOVER" });
  });
  it("não volta antes do planejamento", () => {
    expect(avaliarRetrocesso("PLANEJAMENTO").ok).toBe(false);
  });
});

describe("validarMotivo", () => {
  it("exige pelo menos 10 caracteres sem contar espaços nas pontas", () => {
    expect(validarMotivo("curto")).not.toBeNull();
    expect(validarMotivo("   123456789   ")).not.toBeNull();
    expect(validarMotivo("Cliente liberou o ambiente")).toBeNull();
  });
});
