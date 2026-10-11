import "server-only";
import { revalidatePath } from "next/cache";
import { notFound, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma, type Tx } from "./db";
import {
  ErroPermissao,
  exigirLider,
  exigirMembro,
  exigirSessao,
  type MembroContexto,
  type UsuarioSessao,
} from "./permissoes";

// Padrão de Server Action (seção 9):
// 1. exigirSessao  2. exigirMembro/exigirLider (404 se não membro)  3. schema.safeParse
// 4. prisma.$transaction(escrita + registrarHistorico)  5. revalidatePath  6. { ok, data } | { ok: false, erro }

export type Resultado<T = void> =
  { ok: true; data: T } | { ok: false; erro: string; campos?: Record<string, string[]> };

/** Recusa por regra de negócio (portões, transições). A mensagem vai para o usuário. */
export class ErroNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroNegocio";
  }
}

export const MENSAGEM_CAMPOS = "Revise os campos destacados";
const MENSAGEM_GENERICA = "Não foi possível concluir a operação. Tente novamente em instantes.";

export function erroDeValidacao(erro: z.ZodError): Resultado<never> {
  const campos = z.flattenError(erro).fieldErrors as Record<string, string[]>;
  return { ok: false, erro: MENSAGEM_CAMPOS, campos };
}

/** Converte qualquer erro em mensagem em português (nunca o erro cru do Prisma). */
export function traduzirErro(erro: unknown): Resultado<never> {
  unstable_rethrow(erro); // notFound(), redirect() etc. seguem para o Next
  if (erro instanceof ErroNegocio || erro instanceof ErroPermissao) {
    return { ok: false, erro: erro.message };
  }
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    if (erro.code === "P2002") return { ok: false, erro: "Já existe um registro com esses dados." };
    if (erro.code === "P2025")
      return { ok: false, erro: "Registro não encontrado. Atualize a página." };
    if (erro.code === "P2003") {
      return {
        ok: false,
        erro: "Este registro está em uso por outro e não pode ser alterado assim.",
      };
    }
  }
  console.error("[acao] erro inesperado", erro);
  return { ok: false, erro: MENSAGEM_GENERICA };
}

type Revalidar<D, T> = (dados: D, data: T) => string | string[];

function revalidar(caminhos: string | string[] | undefined) {
  if (!caminhos) return;
  for (const caminho of Array.isArray(caminhos) ? caminhos : [caminhos]) revalidatePath(caminho);
}

const comProjeto = z.object({ projetoId: z.string().min(1) });

/**
 * Action vinculada a um projeto. O schema precisa ter `projetoId`.
 * `permissao: "lider"` recusa Analista; não membro sempre recebe 404.
 */
export function acaoDoProjeto<S extends z.ZodType<{ projetoId: string }>, T>(config: {
  schema: S;
  permissao: "membro" | "lider";
  executar: (ctx: {
    tx: Tx;
    dados: z.output<S>;
    usuario: UsuarioSessao;
    membro: MembroContexto;
  }) => Promise<T>;
  revalidar?: Revalidar<z.output<S>, T>;
}) {
  return async (input: z.input<S>): Promise<Resultado<T>> => {
    try {
      // 1 e 2: sessão e permissão antes de olhar o conteúdo
      const alvo = comProjeto.safeParse(input);
      if (!alvo.success) notFound();
      const { usuario, membro } =
        config.permissao === "lider"
          ? await exigirLider(alvo.data.projetoId)
          : await exigirMembro(alvo.data.projetoId);

      // 3: validação
      const parsed = config.schema.safeParse(input);
      if (!parsed.success) return erroDeValidacao(parsed.error);

      // 4: escrita + histórico na mesma transação
      const data = await prisma.$transaction((tx) =>
        config.executar({ tx, dados: parsed.data, usuario, membro }),
      );

      // 5 e 6
      revalidar(config.revalidar?.(parsed.data, data));
      return { ok: true, data };
    } catch (erro) {
      return traduzirErro(erro);
    }
  };
}

/** Action que só exige sessão (ex.: criar projeto, quando ainda não há membro). */
export function acaoAutenticada<S extends z.ZodType, T>(config: {
  schema: S;
  executar: (ctx: { tx: Tx; dados: z.output<S>; usuario: UsuarioSessao }) => Promise<T>;
  revalidar?: Revalidar<z.output<S>, T>;
}) {
  return async (input: z.input<S>): Promise<Resultado<T>> => {
    try {
      const usuario = await exigirSessao();
      const parsed = config.schema.safeParse(input);
      if (!parsed.success) return erroDeValidacao(parsed.error);
      const data = await prisma.$transaction((tx) =>
        config.executar({ tx, dados: parsed.data, usuario }),
      );
      revalidar(config.revalidar?.(parsed.data, data));
      return { ok: true, data };
    } catch (erro) {
      return traduzirErro(erro);
    }
  };
}
