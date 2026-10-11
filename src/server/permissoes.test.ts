import { beforeEach, describe, expect, it, vi } from "vitest";

// Banco e sessão simulados (seção 16: "acesso ao banco simulado").
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  usuarioFindUnique: vi.fn(),
  membroFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("./auth", () => ({ auth: mocks.auth }));
vi.mock("./db", () => ({
  prisma: {
    usuario: { findUnique: mocks.usuarioFindUnique },
    membroProjeto: { findUnique: mocks.membroFindUnique },
  },
}));

const { ErroPermissao, exigirLider, exigirMembro, exigirSessao } = await import("./permissoes");

const ANA = { id: "u-ana", nome: "Ana Ribeiro", email: "lider@exemplo.com" };

function logadoComo(usuario: typeof ANA | null) {
  mocks.auth.mockResolvedValue(usuario ? { user: { id: usuario.id } } : null);
  mocks.usuarioFindUnique.mockResolvedValue(usuario);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("exigirSessao", () => {
  it("sem sessão redireciona para /login", async () => {
    logadoComo(null);
    await expect(exigirSessao()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("usuário da sessão que não existe mais no banco redireciona para /login", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "apagado" } });
    mocks.usuarioFindUnique.mockResolvedValue(null);
    await expect(exigirSessao()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("com sessão devolve o usuário", async () => {
    logadoComo(ANA);
    await expect(exigirSessao()).resolves.toEqual(ANA);
  });
});

describe("exigirMembro", () => {
  it("membro passa", async () => {
    logadoComo(ANA);
    mocks.membroFindUnique.mockResolvedValue({ id: "m1", papel: "ANALISTA" });
    const r = await exigirMembro("p1");
    expect(r.membro).toEqual({ id: "m1", papel: "ANALISTA" });
    expect(mocks.membroFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projetoId_usuarioId: { projetoId: "p1", usuarioId: ANA.id } },
      }),
    );
  });

  it("não membro recebe 404", async () => {
    logadoComo(ANA);
    mocks.membroFindUnique.mockResolvedValue(null);
    await expect(exigirMembro("p2")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("exigirLider", () => {
  it("Líder passa", async () => {
    logadoComo(ANA);
    mocks.membroFindUnique.mockResolvedValue({ id: "m1", papel: "LIDER" });
    await expect(exigirLider("p3")).resolves.toMatchObject({ membro: { papel: "LIDER" } });
  });

  it("Analista recebe recusa em ação de Líder", async () => {
    logadoComo(ANA);
    mocks.membroFindUnique.mockResolvedValue({ id: "m1", papel: "ANALISTA" });
    await expect(exigirLider("p4")).rejects.toBeInstanceOf(ErroPermissao);
  });

  it("não membro recebe 404, não recusa", async () => {
    logadoComo(ANA);
    mocks.membroFindUnique.mockResolvedValue(null);
    await expect(exigirLider("p5")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
