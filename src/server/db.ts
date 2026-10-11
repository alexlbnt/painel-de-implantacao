import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type Prisma } from "@/generated/prisma/client";
import { env } from "./env";

// Singleton do PrismaClient. O adapter da Neon (Pool via WebSocket) suporta
// transações interativas, exigidas pelo padrão de Server Action (seção 9).
function criarCliente() {
  const adapter = new PrismaNeon({ connectionString: env().DATABASE_URL });
  return new PrismaClient({ adapter });
}

type Cliente = ReturnType<typeof criarCliente>;

const globalParaPrisma = globalThis as unknown as { prisma?: Cliente };

function obterCliente(): Cliente {
  if (!globalParaPrisma.prisma) globalParaPrisma.prisma = criarCliente();
  return globalParaPrisma.prisma;
}

// Criação preguiçosa: importar o módulo no build não abre conexão.
export const prisma = new Proxy({} as Cliente, {
  get(_alvo, prop) {
    const cliente = obterCliente();
    const valor = Reflect.get(cliente, prop);
    return typeof valor === "function" ? valor.bind(cliente) : valor;
  },
});

/** Cliente de transação interativa (`tx` dentro de `prisma.$transaction`). */
export type Tx = Prisma.TransactionClient;
