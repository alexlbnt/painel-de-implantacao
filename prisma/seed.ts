// Seed de demonstração (seção 15). Idempotente: limpa os dados de demonstração e recria.
// TODOS OS DADOS SÃO FICTÍCIOS. Senha apenas para demonstração.
// Cresce a cada sprint junto com as funcionalidades (ver docs/DECISOES.md, D06).
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const SENHA_DEMO = "Demo@2026";

const USUARIOS = [
  { email: "lider@exemplo.com", nome: "Ana Ribeiro" },
  { email: "analista@exemplo.com", nome: "Bruno Costa" },
  { email: "visitante@exemplo.com", nome: "Carla Mendes" }, // sem projetos: testa o 404
] as const;

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Defina DATABASE_URL no .env antes de rodar o seed.");
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

  try {
    const emails = USUARIOS.map((u) => u.email);

    // Limpeza: projetos dos usuários de demonstração (cascata) e os próprios usuários.
    await prisma.projeto.deleteMany({
      where: { membros: { some: { usuario: { email: { in: emails } } } } },
    });
    await prisma.usuario.deleteMany({ where: { email: { in: emails } } });

    const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);
    for (const u of USUARIOS) {
      await prisma.usuario.create({ data: { ...u, senhaHash } });
    }

    console.log(
      `Seed concluído: ${USUARIOS.length} usuários de demonstração (senha ${SENHA_DEMO}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
