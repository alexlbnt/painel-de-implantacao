// Seed de demonstração (seção 15). Idempotente: limpa os dados de demonstração e recria.
// TODOS OS DADOS SÃO FICTÍCIOS. Senha apenas para demonstração.
// Cresce a cada sprint junto com as funcionalidades (ver docs/DECISOES.md, D06).
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { montarSnapshot, proximaDataReuniao } from "../src/lib/regras/reunioes";

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
const iso = (d: Date) => d.toISOString().slice(0, 10);

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
    const idPessoa: Record<string, string> = {};
    for (const [i, p] of pessoas.entries()) {
      const criada = await prisma.pessoaCliente.create({
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
      idPessoa[p.nome] = criada.id;
    }

    // ---------- Sprint 2: módulos e tarefas ----------
    const membrosP1 = await prisma.membroProjeto.findMany({
      where: { projetoId: p1.id },
      select: { id: true, usuarioId: true },
    });
    const membroAna = membrosP1.find((m) => m.usuarioId === ana.id)!.id;
    const membroBruno = membrosP1.find((m) => m.usuarioId === bruno.id)!.id;

    const modulos = [
      {
        nome: "Folha de Pagamento",
        percentual: 80,
        peso: 3,
        status: "EM_VALIDACAO",
        aderencia: 90,
      },
      { nome: "Contabilidade", percentual: 60, peso: 3, status: "EM_IMPLANTACAO", aderencia: 85 },
      { nome: "Compras", percentual: 40, peso: 2, status: "EM_IMPLANTACAO", aderencia: null },
      { nome: "Patrimônio", percentual: 20, peso: 1, status: "EM_IMPLANTACAO", aderencia: null },
      { nome: "Protocolo", percentual: 0, peso: 1, status: "NAO_INICIADO", aderencia: null },
    ] as const;
    const idModulo: Record<string, string> = {};
    for (const m of modulos) {
      const criado = await prisma.modulo.create({ data: { projetoId: p1.id, ...m } });
      idModulo[m.nome] = criado.id;
    }

    type TarefaSeed = {
      titulo: string;
      modulo?: string;
      dep?: string;
      membro?: string;
      pessoa?: string;
      prazo?: number;
      status?: "A_FAZER" | "EM_ANDAMENTO" | "BLOQUEADA" | "CONCLUIDA";
      parte?: "CONTRATADA" | "CONTRATANTE";
      prioridade?: "BAIXA" | "MEDIA" | "ALTA";
      motivo?: string;
    };
    const tarefas: TarefaSeed[] = [
      // 3 atrasadas da contratante
      {
        titulo: "Enviar planilha de rubricas da folha",
        modulo: "Folha de Pagamento",
        dep: "Recursos Humanos",
        pessoa: "Marcos Vieira",
        prazo: -8,
        parte: "CONTRATANTE",
        prioridade: "ALTA",
      },
      {
        titulo: "Validar plano de contas importado",
        modulo: "Contabilidade",
        dep: "Contabilidade",
        pessoa: "Patrícia Lima",
        prazo: -4,
        parte: "CONTRATANTE",
        status: "EM_ANDAMENTO",
      },
      {
        titulo: "Indicar responsável pelo cadastro de fornecedores",
        modulo: "Compras",
        dep: "Compras",
        pessoa: "Juliana Prado",
        prazo: -2,
        parte: "CONTRATANTE",
      },
      // 1 atrasada da contratada
      {
        titulo: "Parametrizar tabela de incidências",
        modulo: "Folha de Pagamento",
        membro: "bruno",
        prazo: -3,
        status: "EM_ANDAMENTO",
        prioridade: "ALTA",
      },
      // 1 bloqueada com motivo
      {
        titulo: "Importar saldos do patrimônio",
        modulo: "Patrimônio",
        dep: "Patrimônio",
        membro: "bruno",
        prazo: 6,
        status: "BLOQUEADA",
        motivo: "Aguardando o cliente liberar o acesso à base do sistema anterior.",
      },
      // demais
      {
        titulo: "Conferir cálculo da folha paralela",
        modulo: "Folha de Pagamento",
        membro: "bruno",
        prazo: 4,
        status: "EM_ANDAMENTO",
      },
      {
        titulo: "Treinar equipe de RH em lançamentos mensais",
        modulo: "Folha de Pagamento",
        dep: "Recursos Humanos",
        membro: "ana",
        prazo: 9,
      },
      {
        titulo: "Configurar integração bancária da contabilidade",
        modulo: "Contabilidade",
        membro: "ana",
        prazo: 12,
        prioridade: "ALTA",
      },
      {
        titulo: "Revisar fluxo de aprovação de compras",
        modulo: "Compras",
        dep: "Compras",
        membro: "bruno",
        prazo: 15,
      },
      {
        titulo: "Levantar inventário inicial de bens",
        modulo: "Patrimônio",
        dep: "Patrimônio",
        pessoa: "Sérgio Nunes",
        prazo: 18,
        parte: "CONTRATANTE",
      },
      {
        titulo: "Definir tipos de documento do protocolo",
        modulo: "Protocolo",
        dep: "Protocolo",
        pessoa: "Lívia Martins",
        prazo: 21,
        parte: "CONTRATANTE",
        prioridade: "BAIXA",
      },
      {
        titulo: "Cadastrar usuários e perfis de acesso",
        membro: "ana",
        prazo: -20,
        status: "CONCLUIDA",
      },
      {
        titulo: "Instalar ambiente de homologação",
        membro: "bruno",
        prazo: -30,
        status: "CONCLUIDA",
      },
      {
        titulo: "Migrar cadastro de servidores",
        modulo: "Folha de Pagamento",
        dep: "Recursos Humanos",
        membro: "bruno",
        prazo: -12,
        status: "CONCLUIDA",
      },
      {
        titulo: "Agendar visita técnica ao almoxarifado",
        dep: "Compras",
        membro: "ana",
        status: "A_FAZER",
        prioridade: "BAIXA",
      },
    ];
    // ---------- Sprint 3: reuniões (1 KICKOFF, 2 e 3 SEMANAL finalizadas, 4 SEMANAL rascunho) ----------
    const proxima = new Date(proximaDataReuniao(iso(HOJE), 4) + "T00:00:00.000Z");
    const datasReuniao = [
      new Date(proxima.getTime() - 63 * UM_DIA),
      new Date(proxima.getTime() - 14 * UM_DIA),
      new Date(proxima.getTime() - 7 * UM_DIA),
      proxima,
    ];
    const reunioes: Awaited<ReturnType<typeof prisma.reuniao.create>>[] = [];
    for (const [i, data] of datasReuniao.entries()) {
      reunioes.push(
        await prisma.reuniao.create({
          data: {
            projetoId: p1.id,
            tipo: i === 0 ? "KICKOFF" : "SEMANAL",
            numero: i + 1,
            data,
            horaInicio: "09:00",
            horaFim: "10:30",
            local:
              i === 0
                ? "Gabinete da Secretaria de Administração"
                : "Sala de reuniões da Prefeitura (fictícia)",
          },
        }),
      );
    }
    const acaoDaReuniao: Record<string, number> = {
      "Enviar planilha de rubricas da folha": 2,
      "Parametrizar tabela de incidências": 2,
      "Migrar cadastro de servidores": 2,
      "Validar plano de contas importado": 3,
      "Indicar responsável pelo cadastro de fornecedores": 3,
      "Importar saldos do patrimônio": 3,
      "Conferir cálculo da folha paralela": 4,
    };

    const ordemPorStatus: Record<string, number> = {};
    for (const t of tarefas) {
      const status = t.status ?? "A_FAZER";
      ordemPorStatus[status] = (ordemPorStatus[status] ?? -1) + 1;
      await prisma.tarefa.create({
        data: {
          projetoId: p1.id,
          titulo: t.titulo,
          moduloId: t.modulo ? idModulo[t.modulo] : null,
          departamentoId: t.dep ? deps[t.dep] : null,
          responsavelMembroId:
            t.membro === "ana" ? membroAna : t.membro === "bruno" ? membroBruno : null,
          responsavelPessoaId: t.pessoa ? idPessoa[t.pessoa] : null,
          prazo: t.prazo !== undefined ? dia(t.prazo) : null,
          status,
          parteResponsavel: t.parte ?? "CONTRATADA",
          prioridade: t.prioridade ?? "MEDIA",
          motivoBloqueio: t.motivo ?? null,
          concluidaEm: status === "CONCLUIDA" ? dia((t.prazo ?? 0) - 1) : null,
          ordem: ordemPorStatus[status],
          reuniaoOrigemId: acaoDaReuniao[t.titulo]
            ? reunioes[acaoDaReuniao[t.titulo] - 1].id
            : null,
        },
      });
    }

    // Impedimentos: 2 abertos (dados legados; pessoal-chave) e 1 resolvido.
    type ImpedimentoSeed = {
      categoria: "INFRAESTRUTURA_CLIENTE" | "PESSOAL_CHAVE" | "DADOS_LEGADOS" | "OUTRO";
      descricao: string;
      parteResponsavel: "CONTRATADA" | "CONTRATANTE";
      abertoEm: Date;
      status: "ABERTO" | "RESOLVIDO";
      resolvidoEm?: Date;
      resolucao?: string;
      reuniaoId: string;
    };
    const impedimentos: ImpedimentoSeed[] = [
      {
        categoria: "INFRAESTRUTURA_CLIENTE",
        descricao:
          "VPN de acesso ao servidor do cliente indisponível para a equipe de implantação.",
        parteResponsavel: "CONTRATANTE",
        abertoEm: dia(-30),
        status: "RESOLVIDO",
        resolvidoEm: dia(-24),
        resolucao: "TI do cliente liberou a VPN e enviou as credenciais por canal seguro.",
        reuniaoId: reunioes[1].id,
      },
      {
        categoria: "DADOS_LEGADOS",
        descricao:
          "Base do sistema anterior ainda não entregue; saldos do patrimônio aguardam a extração.",
        parteResponsavel: "CONTRATANTE",
        abertoEm: dia(-20),
        status: "ABERTO",
        reuniaoId: reunioes[1].id,
      },
      {
        categoria: "PESSOAL_CHAVE",
        descricao:
          "Responsável pelo setor de Compras em férias; validações do módulo estão paradas.",
        parteResponsavel: "CONTRATANTE",
        abertoEm: dia(-6),
        status: "ABERTO",
        reuniaoId: reunioes[2].id,
      },
    ];
    for (const imp of impedimentos) {
      await prisma.impedimento.create({ data: { projetoId: p1.id, ...imp } });
    }

    const participantesPadrao = (reuniaoId: string) => [
      { reuniaoId, parte: "CONTRATADA" as const, membroId: membroAna },
      { reuniaoId, parte: "CONTRATADA" as const, membroId: membroBruno },
      { reuniaoId, parte: "CONTRATANTE" as const, pessoaClienteId: idPessoa["Helena Duarte"] },
      { reuniaoId, parte: "CONTRATANTE" as const, pessoaClienteId: idPessoa["Otávio Rezende"] },
    ];
    for (const r of reunioes) {
      await prisma.participanteReuniao.createMany({ data: participantesPadrao(r.id) });
    }
    const AVULSO = "Representante da TI municipal (fictício)";
    await prisma.participanteReuniao.create({
      data: { reuniaoId: reunioes[0].id, parte: "CONTRATANTE", nomeAvulso: AVULSO },
    });

    const decisoes: Record<number, string[]> = {
      1: [
        "Cronograma macro aprovado, com início da execução após a entrega do termo de dados legados.",
        "Reunião semanal de governança às quintas-feiras, às 9h.",
      ],
      2: ["A folha paralela roda em dois meses consecutivos antes da virada."],
      3: [
        "Saldos do patrimônio serão importados assim que a base legada for entregue.",
        "Compras valida o fluxo de aprovação na volta da responsável.",
      ],
      4: ["Priorizar a conferência da folha paralela."],
    };
    for (const [numero, textos] of Object.entries(decisoes)) {
      await prisma.decisao.createMany({
        data: textos.map((texto, i) => ({
          reuniaoId: reunioes[Number(numero) - 1].id,
          numero: i + 1,
          texto,
        })),
      });
    }
    await prisma.reuniao.update({
      where: { id: reunioes[3].id },
      data: {
        resumoStatus:
          "Folha em validação; contabilidade avançando; patrimônio travado pela base legada.",
      },
    });

    // Finaliza 1, 2 e 3 com snapshot montado pela mesma função do app (status do momento).
    const nomesParticipantes = [
      { parte: "CONTRATADA" as const, nome: USUARIOS.ana.nome },
      { parte: "CONTRATADA" as const, nome: USUARIOS.bruno.nome },
      { parte: "CONTRATANTE" as const, nome: "Helena Duarte" },
      { parte: "CONTRATANTE" as const, nome: "Otávio Rezende" },
    ];
    const tarefasP1 = await prisma.tarefa.findMany({
      where: { projetoId: p1.id, reuniaoOrigemId: { not: null } },
      include: {
        responsavelMembro: { select: { usuario: { select: { nome: true } } } },
        responsavelPessoa: { select: { nome: true } },
      },
    });
    const acoesDe = (reuniaoId: string) =>
      tarefasP1
        .filter((t) => t.reuniaoOrigemId === reuniaoId)
        .map((t) => ({
          titulo: t.titulo,
          responsavel: t.responsavelMembro?.usuario.nome ?? t.responsavelPessoa?.nome ?? null,
          prazo: t.prazo ? iso(t.prazo) : null,
          parteResponsavel: t.parteResponsavel,
        }));
    const resumos = [
      "Kickoff realizado; escopo, cronograma e responsáveis apresentados.",
      "Migração de servidores concluída; folha em parametrização.",
      "Folha em validação; contabilidade iniciada; patrimônio aguarda base legada.",
    ];
    const percentuais = [0, 38, 46];
    for (const i of [0, 1, 2]) {
      const r = reunioes[i];
      const anterior = i > 0 ? reunioes[i - 1] : null;
      const finalizadaEm = new Date(r.data.getTime() + 11 * 3_600_000);
      const resolvidoNaData = (imp: ImpedimentoSeed) =>
        imp.status === "RESOLVIDO" && imp.resolvidoEm !== undefined && imp.resolvidoEm <= r.data;
      const snapshot = montarSnapshot({
        cabecalho: {
          tipo: r.tipo,
          numero: r.numero,
          data: iso(r.data),
          horaInicio: r.horaInicio,
          horaFim: r.horaFim,
          local: r.local,
          projeto: { nome: p1.nome, cliente: p1.cliente, municipio: p1.municipio, uf: p1.uf },
        },
        participantes:
          i === 0
            ? [...nomesParticipantes, { parte: "CONTRATANTE" as const, nome: AVULSO }]
            : nomesParticipantes,
        percentualNoDia: percentuais[i],
        resumoStatus: resumos[i],
        acoesAnteriores: {
          reuniaoNumero: anterior?.numero ?? null,
          // status "no momento" daquela reunião
          itens: anterior
            ? acoesDe(anterior.id).map(({ titulo, responsavel, prazo }) => ({
                titulo,
                responsavel,
                prazo,
                status: "EM_ANDAMENTO",
              }))
            : [],
        },
        impedimentos: impedimentos
          .filter((imp) => imp.abertoEm <= r.data)
          .map((imp) => ({
            categoria: imp.categoria,
            descricao: imp.descricao,
            parteResponsavel: imp.parteResponsavel,
            abertoEm: iso(imp.abertoEm),
            status: resolvidoNaData(imp) ? "RESOLVIDO" : "ABERTO",
            resolucao: resolvidoNaData(imp) ? (imp.resolucao ?? null) : null,
          })),
        decisoes: (decisoes[i + 1] ?? []).map((texto, j) => ({ numero: j + 1, texto })),
        planoAcao: acoesDe(r.id),
        salvaguardas:
          i === 0 ? "O cliente se compromete a entregar a base legada em até 10 dias úteis." : null,
        finalizadaEm,
      });
      await prisma.reuniao.update({
        where: { id: r.id },
        data: {
          status: "FINALIZADA",
          finalizadaEm,
          percentualNoDia: snapshot.percentualNoDia,
          resumoStatus: snapshot.resumoStatus,
          salvaguardas: snapshot.salvaguardas,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
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
