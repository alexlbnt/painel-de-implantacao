import { describe, expect, it } from "vitest";
import {
  camposDoStatus,
  codificarResponsavel,
  decodificarResponsavel,
  filtrarTarefas,
  reposicionar,
  resumoAtrasadas,
  validarBloqueio,
  type TarefaFiltravel,
} from "./tarefas";

describe("validarBloqueio (RN11)", () => {
  it("bloquear exige motivo", () => {
    expect(validarBloqueio("BLOQUEADA", "")).not.toBeNull();
    expect(validarBloqueio("BLOQUEADA", null)).not.toBeNull();
    expect(validarBloqueio("BLOQUEADA", "   curto   ")).not.toBeNull();
    expect(validarBloqueio("BLOQUEADA", "Aguardando acesso ao servidor")).toBeNull();
  });
  it("outros status não exigem motivo", () => {
    expect(validarBloqueio("EM_ANDAMENTO", "")).toBeNull();
  });
});

describe("camposDoStatus", () => {
  const agora = new Date("2026-10-20T15:00:00Z");
  const antes = new Date("2026-10-10T10:00:00Z");

  it("grava o motivo ao bloquear e limpa ao desbloquear", () => {
    expect(
      camposDoStatus(
        { status: "A_FAZER", concluidaEm: null },
        "BLOQUEADA",
        " Sem acesso ao banco ",
        agora,
      ),
    ).toEqual({ status: "BLOQUEADA", motivoBloqueio: "Sem acesso ao banco", concluidaEm: null });
    expect(
      camposDoStatus({ status: "BLOQUEADA", concluidaEm: null }, "EM_ANDAMENTO", "x", agora)
        .motivoBloqueio,
    ).toBeNull();
  });

  it("grava concluidaEm ao concluir, mantém se já concluída e limpa ao reabrir", () => {
    expect(
      camposDoStatus({ status: "EM_ANDAMENTO", concluidaEm: null }, "CONCLUIDA", null, agora)
        .concluidaEm,
    ).toEqual(agora);
    expect(
      camposDoStatus({ status: "CONCLUIDA", concluidaEm: antes }, "CONCLUIDA", null, agora)
        .concluidaEm,
    ).toEqual(antes);
    expect(
      camposDoStatus({ status: "CONCLUIDA", concluidaEm: antes }, "A_FAZER", null, agora)
        .concluidaEm,
    ).toBeNull();
  });
});

describe("reposicionar", () => {
  it("move dentro da coluna", () => {
    expect(reposicionar(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
  });
  it("insere vindo de outra coluna", () => {
    expect(reposicionar(["a", "b"], "x", 1)).toEqual(["a", "x", "b"]);
  });
  it("limita o índice", () => {
    expect(reposicionar(["a"], "x", 99)).toEqual(["a", "x"]);
    expect(reposicionar(["a"], "x", -3)).toEqual(["x", "a"]);
  });
});

describe("responsável", () => {
  it("codifica e decodifica membro ou pessoa", () => {
    expect(codificarResponsavel({ membroId: "m1", pessoaId: null })).toBe("m:m1");
    expect(codificarResponsavel({ membroId: null, pessoaId: "p1" })).toBe("p:p1");
    expect(codificarResponsavel({ membroId: null, pessoaId: null })).toBe("");
    expect(decodificarResponsavel("m:m1")).toEqual({ membroId: "m1", pessoaId: null });
    expect(decodificarResponsavel("p:p1")).toEqual({ membroId: null, pessoaId: "p1" });
    expect(decodificarResponsavel("")).toEqual({ membroId: null, pessoaId: null });
    expect(decodificarResponsavel("x:1")).toEqual({ membroId: null, pessoaId: null });
  });
});

const HOJE = "2026-10-20";
const t = (p: Partial<TarefaFiltravel> = {}): TarefaFiltravel => ({
  status: "A_FAZER",
  prazo: null,
  parteResponsavel: "CONTRATADA",
  moduloId: null,
  departamentoId: null,
  responsavelMembroId: null,
  responsavelPessoaId: null,
  ...p,
});

describe("filtrarTarefas", () => {
  const tarefas = [
    t({ moduloId: "folha", parteResponsavel: "CONTRATANTE", prazo: "2026-10-01" }),
    t({ moduloId: "folha", responsavelMembroId: "m1", prazo: "2026-10-30" }),
    t({
      departamentoId: "rh",
      responsavelPessoaId: "p1",
      status: "CONCLUIDA",
      prazo: "2026-10-01",
    }),
  ];
  it("filtra por módulo, departamento, parte e responsável", () => {
    expect(filtrarTarefas(tarefas, { moduloId: "folha" }, HOJE)).toHaveLength(2);
    expect(filtrarTarefas(tarefas, { departamentoId: "rh" }, HOJE)).toHaveLength(1);
    expect(filtrarTarefas(tarefas, { parte: "CONTRATANTE" }, HOJE)).toHaveLength(1);
    expect(filtrarTarefas(tarefas, { responsavel: "m:m1" }, HOJE)).toHaveLength(1);
    expect(filtrarTarefas(tarefas, { responsavel: "p:p1" }, HOJE)).toHaveLength(1);
  });
  it("atrasadas ignora concluídas", () => {
    expect(filtrarTarefas(tarefas, { atrasadas: true }, HOJE)).toHaveLength(1);
  });
  it("sem filtros devolve tudo", () => {
    expect(filtrarTarefas(tarefas, {}, HOJE)).toHaveLength(3);
  });
});

describe("resumoAtrasadas", () => {
  it("divide por parte responsável", () => {
    const r = resumoAtrasadas(
      [
        t({ prazo: "2026-10-01", parteResponsavel: "CONTRATANTE" }),
        t({ prazo: "2026-10-01", parteResponsavel: "CONTRATANTE" }),
        t({ prazo: "2026-10-01" }),
        t({ prazo: "2026-10-30" }),
        t({ prazo: "2026-10-01", status: "CONCLUIDA" }),
      ],
      HOJE,
    );
    expect(r).toEqual({ total: 3, contratada: 1, contratante: 2 });
  });
});
