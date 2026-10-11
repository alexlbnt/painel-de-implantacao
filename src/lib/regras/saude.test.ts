import { describe, expect, it } from "vitest";
import { calcularSaude, tarefaAtrasada, type TarefaSaude } from "./saude";

const HOJE = "2026-10-20"; // terça
const tarefa = (p: Partial<TarefaSaude> = {}): TarefaSaude => ({
  status: "A_FAZER",
  prazo: "2026-10-30",
  parteResponsavel: "CONTRATADA",
  ...p,
});

describe("tarefaAtrasada", () => {
  it("não concluída com prazo antes de hoje", () => {
    expect(tarefaAtrasada({ status: "EM_ANDAMENTO", prazo: "2026-10-19" }, HOJE)).toBe(true);
  });
  it("prazo hoje não é atraso", () => {
    expect(tarefaAtrasada({ status: "A_FAZER", prazo: HOJE }, HOJE)).toBe(false);
  });
  it("concluída ou sem prazo nunca atrasa", () => {
    expect(tarefaAtrasada({ status: "CONCLUIDA", prazo: "2026-10-01" }, HOJE)).toBe(false);
    expect(tarefaAtrasada({ status: "A_FAZER", prazo: null }, HOJE)).toBe(false);
  });
});

describe("calcularSaude", () => {
  it("EM_DIA sem atrasos nem impedimentos abertos", () => {
    const dados = {
      tarefas: [tarefa()],
      impedimentos: [{ status: "RESOLVIDO" as const, abertoEm: "2026-01-01" }],
    };
    expect(calcularSaude(dados, HOJE)).toBe("EM_DIA");
  });

  it("ATENCAO com uma tarefa atrasada", () => {
    const dados = { tarefas: [tarefa({ prazo: "2026-10-19" })], impedimentos: [] };
    expect(calcularSaude(dados, HOJE)).toBe("ATENCAO");
  });

  it("ATENCAO com um impedimento aberto recente", () => {
    const dados = {
      tarefas: [],
      impedimentos: [{ status: "ABERTO" as const, abertoEm: "2026-10-15" }],
    };
    expect(calcularSaude(dados, HOJE)).toBe("ATENCAO");
  });

  it("impedimento com exatamente 10 dias úteis ainda é ATENCAO", () => {
    // 05/10 → 20/10: 6, 7, 8, 9, (12 é feriado), 13, 14, 15, 16, 19, 20 = 10 dias úteis
    const dados = {
      tarefas: [],
      impedimentos: [{ status: "ABERTO" as const, abertoEm: "2026-10-05" }],
    };
    expect(calcularSaude(dados, HOJE)).toBe("ATENCAO");
  });

  it("CRITICO com impedimento aberto há mais de 10 dias úteis", () => {
    // 02/10 → 20/10 = 11 dias úteis
    const dados = {
      tarefas: [],
      impedimentos: [{ status: "ABERTO" as const, abertoEm: "2026-10-02" }],
    };
    expect(calcularSaude(dados, HOJE)).toBe("CRITICO");
  });

  it("feriado municipal entra na contagem de dias úteis", () => {
    // 02/10 → 20/10 com feriado municipal em 07/10 = 10 dias úteis
    const dados = {
      tarefas: [],
      impedimentos: [{ status: "ABERTO" as const, abertoEm: "2026-10-02" }],
    };
    expect(calcularSaude(dados, HOJE, ["2026-10-07"])).toBe("ATENCAO");
  });

  it("4 atrasadas da contratada = ATENCAO; 5 = CRITICO", () => {
    const atrasada = tarefa({ prazo: "2026-10-01" });
    expect(calcularSaude({ tarefas: Array(4).fill(atrasada), impedimentos: [] }, HOJE)).toBe(
      "ATENCAO",
    );
    expect(calcularSaude({ tarefas: Array(5).fill(atrasada), impedimentos: [] }, HOJE)).toBe(
      "CRITICO",
    );
  });

  it("atrasadas da contratante não contam para o limite de CRITICO", () => {
    const daContratante = tarefa({ prazo: "2026-10-01", parteResponsavel: "CONTRATANTE" });
    expect(calcularSaude({ tarefas: Array(8).fill(daContratante), impedimentos: [] }, HOJE)).toBe(
      "ATENCAO",
    );
  });
});
