// Seed de demonstração (seção 15). Idempotente: limpa os dados de demonstração e recria.
// TODOS OS DADOS SÃO FICTÍCIOS. Senha apenas para demonstração.
// Cresce a cada sprint junto com as funcionalidades (ver docs/DECISOES.md, D06).
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const SENHA_DEMO = "Demo@2026";

const USUARIOS = {
  ana: { email: "lider@exemplo.com", nome: "Ana Ribeiro" },
  bruno: { email: "analista@exemplo.com", nome: "Bruno Costa" },
  carla: { email: "visitante@exemplo.com", nome: "Carla Mendes" }, // sem projetos: testa o 404
} as const;

const CRITERIOS = [
  "SALDOS_INICIAIS_ACEITOS",
  "AUTONOMIA_USUARIOS_CHAVE",
  "INTEGRACOES_OBRIGATORIAS_ATIVAS",
  "WIKI_CONSOLIDADA",
] as const;

// ---------- datas relativas a hoje, para a demonstração não envelhecer ----------
const HOJE = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
const UM_DIA = 86_400_000;
/** Data (@db.Date) a `n` dias de hoje; negativo = passado. */
function dia(n: number): Date {
  return new Date(HOJE.getTime() + n * UM_DIA);
}

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Defina DATABASE_URL no .env antes de rodar o seed.");
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

  try {
    const emails = Object.values(USUARIOS).map((u) => u.email);

    // Limpeza: projetos dos usuários de demonstração (cascata) e os próprios usuários.
    await prisma.projeto.deleteMany({
      where: { membros: { some: { usuario: { email: { in: emails } } } } },
    });
    await prisma.usuario.deleteMany({ where: { email: { in: emails } } });

    const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);
    const [ana, bruno] = await Promise.all([
      prisma.usuario.create({ data: { ...USUARIOS.ana, senhaHash } }),
      prisma.usuario.create({ data: { ...USUARIOS.bruno, senhaHash } }),
      prisma.usuario.create({ data: { ...USUARIOS.carla, senhaHash } }),
    ]);

    // =====================================================================
    // Projeto 1 — Município Exemplo de Vale Verde (fase EXECUCAO)
    // =====================================================================
    const p1 = await prisma.projeto.create({
      data: {
        nome: "Implantação — Município Exemplo de Vale Verde",
        cliente: "Prefeitura Municipal de Vale Verde (fictícia)",
        municipio: "Vale Verde",
        uf: "MG",
        handoffEm: dia(-75),
        abertoEm: new Date(dia(-74).getTime() + 14 * 3_600_000),
        inicioPrevisto: dia(-70),
        fimPrevisto: dia(60),
        fase: "EXECUCAO",
        diaReuniao: 4,
        membros: {
          create: [
            { usuarioId: ana.id, papel: "LIDER" },
            { usuarioId: bruno.id, papel: "ANALISTA" },
          ],
        },
        criterios: { create: CRITERIOS.map((tipo) => ({ tipo })) },
        feriados: { create: { data: dia(25), nome: "Aniversário de Vale Verde (fictício)" } },
      },
    });

    const nomesDep = ["Recursos Humanos", "Contabilidade", "Compras", "Patrimônio", "Protocolo"];
    const deps = Object.fromEntries(
      await Promise.all(
        nomesDep.map(async (nome) => {
          const d = await prisma.departamento.create({ data: { projetoId: p1.id, nome } });
          return [nome, d.id] as const;
        }),
      ),
    );

    const pessoas = [
      { nome: "Helena Duarte", cargo: "Secretária de Administração", dep: "Recursos Humanos" },
      {
        nome: "Marcos Vieira",
        cargo: "Diretor de Recursos Humanos",
        dep: "Recursos Humanos",
        chave: true,
        autonomia: dia(-10),
      },
      { nome: "Patrícia Lima", cargo: "Contadora", dep: "Contabilidade", chave: true },
      { nome: "Rafael Souza", cargo: "Assistente contábil", dep: "Contabilidade" },
      { nome: "Juliana Prado", cargo: "Chefe de Compras", dep: "Compras" },
      { nome: "Sérgio Nunes", cargo: "Responsável pelo Patrimônio", dep: "Patrimônio" },
      { nome: "Lívia Martins", cargo: "Atendente do Protocolo", dep: "Protocolo" },
      { nome: "Otávio Rezende", cargo: "Gestor do contrato", dep: null },
    ];
    for (const [i, p] of pessoas.entries()) {
      await prisma.pessoaCliente.create({
        data: {
          projetoId: p1.id,
          nome: p.nome,
          cargo: p.cargo,
          departamentoId: p.dep ? deps[p.dep] : null,
          email: `contato${i + 1}@valeverde.exemplo`,
          telefone: `(00) 90000-00${String(i + 1).padStart(2, "0")}`,
          usuarioChave: p.chave ?? false,
          autonomiaConfirmadaEm: p.autonomia ?? null,
        },
      });
    }

    await prisma.historicoAlteracao.createMany({
      data: [
        {
          projetoId: p1.id,
          autorId: ana.id,
          entidade: "Projeto",
          registroId: p1.id,
          acao: "CRIAR",
          valorNovo: `${p1.nome} (${p1.cliente})`,
          criadoEm: p1.abertoEm,
        },
        {
          projetoId: p1.id,
          autorId: ana.id,
          entidade: "Projeto",
          registroId: p1.id,
          acao: "ATUALIZAR",
          campo: "fase",
          valorAnterior: "PLANEJAMENTO",
          valorNovo: "EXECUCAO",
          motivo: "Kickoff realizado; ata de abertura e termo de dados legados assinados.",
          criadoEm: dia(-60),
        },
      ],
    });

    // =====================================================================
    // Projeto 2 — Câmara Exemplo de Serra Clara (fase PLANEJAMENTO, poucos dados)
    // =====================================================================
    const p2 = await prisma.projeto.create({
      data: {
        nome: "Implantação — Câmara Exemplo de Serra Clara",
        cliente: "Câmara Municipal de Serra Clara (fictícia)",
        municipio: "Serra Clara",
        uf: "GO",
        handoffEm: dia(-6),
        abertoEm: dia(-3),
        inicioPrevisto: dia(7),
        fimPrevisto: dia(120),
        membros: {
          create: [
            { usuarioId: bruno.id, papel: "LIDER" },
            { usuarioId: ana.id, papel: "ANALISTA" },
          ],
        },
        criterios: { create: CRITERIOS.map((tipo) => ({ tipo })) },
        departamentos: { create: [{ nome: "Secretaria Legislativa" }, { nome: "Financeiro" }] },
      },
    });
    await prisma.pessoaCliente.create({
      data: { projetoId: p2.id, nome: "Renata Alves", cargo: "Diretora administrativa" },
    });
    await prisma.historicoAlteracao.create({
      data: {
        projetoId: p2.id,
        autorId: bruno.id,
        entidade: "Projeto",
        registroId: p2.id,
        acao: "CRIAR",
        valorNovo: `${p2.nome} (${p2.cliente})`,
        criadoEm: p2.abertoEm,
      },
    });

    console.log(`Seed concluído: 3 usuários e 2 projetos de demonstração (senha ${SENHA_DEMO}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
