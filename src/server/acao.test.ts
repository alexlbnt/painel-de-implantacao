import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  exigirMembro: vi.fn(),
  exigirLider: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  unstable_rethrow: (e: unknown) => {
    if (e instanceof Error && e.message.startsWith("NEXT_")) throw e;
  },
}));
vi.mock("./db", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("./permissoes", async () => {
  class ErroPermissao extends Error {}
  return {
    ErroPermissao,
    exigirMembro: mocks.exigirMembro,
    exigirLider: mocks.exigirLider,
    exigirSessao: vi.fn(),
  };
});

const { acaoDoProjeto, ErroNegocio, MENSAGEM_CAMPOS } = await import("./acao");
const { ErroPermissao } = await import("./permissoes");

const schema = z.object({ projetoId: z.string(), nome: z.string().min(3, "Nome curto") });
const contexto = {
  usuario: { id: "u1", nome: "Ana", email: "a@exemplo.com" },
  membro: { id: "m1", papel: "LIDER" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn({ tx: true }));
});

describe("acaoDoProjeto", () => {
  it("fluxo feliz: permissão, validação, transação e revalidação", async () => {
    mocks.exigirMembro.mockResolvedValue(contexto);
    const executar = vi.fn().mockResolvedValue({ id: "x" });
    const acao = acaoDoProjeto({
      schema,
      permissao: "membro",
      executar,
      revalidar: (d) => `/projetos/${d.projetoId}`,
    });

    const r = await acao({ projetoId: "p1", nome: "Teste" });

    expect(r).toEqual({ ok: true, data: { id: "x" } });
    expect(mocks.exigirMembro).toHaveBeenCalledWith("p1");
    expect(executar).toHaveBeenCalledWith(
      expect.objectContaining({ tx: { tx: true }, dados: { projetoId: "p1", nome: "Teste" } }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projetos/p1");
  });

  it("checa a permissão antes de validar os campos", async () => {
    mocks.exigirLider.mockRejectedValue(
      new ErroPermissao("Apenas o Líder do projeto pode fazer isso."),
    );
    const executar = vi.fn();
    const acao = acaoDoProjeto({ schema, permissao: "lider", executar });

    const r = await acao({ projetoId: "p1", nome: "" });

    expect(r).toEqual({ ok: false, erro: "Apenas o Líder do projeto pode fazer isso." });
    expect(executar).not.toHaveBeenCalled();
  });

  it("não membro: o 404 é propagado ao Next", async () => {
    mocks.exigirMembro.mockRejectedValue(new Error("NEXT_NOT_FOUND"));
    const acao = acaoDoProjeto({ schema, permissao: "membro", executar: vi.fn() });
    await expect(acao({ projetoId: "p1", nome: "Teste" })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("campos inválidos devolvem a mensagem padrão e os erros por campo", async () => {
    mocks.exigirMembro.mockResolvedValue(contexto);
    const acao = acaoDoProjeto({ schema, permissao: "membro", executar: vi.fn() });
    const r = await acao({ projetoId: "p1", nome: "a" });
    expect(r).toEqual({ ok: false, erro: MENSAGEM_CAMPOS, campos: { nome: ["Nome curto"] } });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("erro de regra de negócio vira mensagem para o usuário", async () => {
    mocks.exigirMembro.mockResolvedValue(contexto);
    const acao = acaoDoProjeto({
      schema,
      permissao: "membro",
      executar: async () => {
        throw new ErroNegocio("Falta a ata de abertura.");
      },
    });
    expect(await acao({ projetoId: "p1", nome: "Teste" })).toEqual({
      ok: false,
      erro: "Falta a ata de abertura.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("erro inesperado não vaza detalhes", async () => {
    mocks.exigirMembro.mockResolvedValue(contexto);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const acao = acaoDoProjeto({
      schema,
      permissao: "membro",
      executar: async () => {
        throw new Error("connection refused at 10.0.0.1");
      },
    });
    const r = await acao({ projetoId: "p1", nome: "Teste" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.erro).not.toContain("10.0.0.1");
  });

  it("projetoId ausente responde 404", async () => {
    const acao = acaoDoProjeto({ schema, permissao: "membro", executar: vi.fn() });
    // @ts-expect-error — chamada propositalmente sem projetoId
    await expect(acao({ nome: "Teste" })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
