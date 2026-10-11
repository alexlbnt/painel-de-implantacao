-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PapelProjeto" AS ENUM ('LIDER', 'ANALISTA');

-- CreateEnum
CREATE TYPE "FaseProjeto" AS ENUM ('PLANEJAMENTO', 'EXECUCAO', 'CHECKOUT', 'HANDOVER', 'TRANSICAO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('ATIVO', 'AGUARDANDO_PRONTIDAO', 'PAUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Parte" AS ENUM ('CONTRATADA', 'CONTRATANTE');

-- CreateEnum
CREATE TYPE "StatusModulo" AS ENUM ('NAO_INICIADO', 'EM_IMPLANTACAO', 'EM_VALIDACAO', 'IMPLANTADO');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('A_FAZER', 'EM_ANDAMENTO', 'BLOQUEADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "TipoReuniao" AS ENUM ('KICKOFF', 'SEMANAL', 'PRONTIDAO');

-- CreateEnum
CREATE TYPE "StatusReuniao" AS ENUM ('RASCUNHO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "CategoriaImpedimento" AS ENUM ('INFRAESTRUTURA_CLIENTE', 'PESSOAL_CHAVE', 'DADOS_LEGADOS', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusImpedimento" AS ENUM ('ABERTO', 'RESOLVIDO');

-- CreateEnum
CREATE TYPE "TipoEvidencia" AS ENUM ('ATA_ABERTURA', 'TERMO_DADOS_LEGADOS', 'ATA_SEMANAL', 'TERMO_ACEITE_MIGRACAO', 'CHECKLIST', 'ATA_PRONTIDAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('RASCUNHO', 'ENVIADO', 'ASSINADO', 'RECUSADO', 'ACEITE_TACITO');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('EMAIL', 'MENSAGEM', 'PRESENCIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoCriterio" AS ENUM ('SALDOS_INICIAIS_ACEITOS', 'AUTONOMIA_USUARIOS_CHAVE', 'INTEGRACOES_OBRIGATORIAS_ATIVAS', 'WIKI_CONSOLIDADA');

-- CreateEnum
CREATE TYPE "CategoriaNota" AS ENUM ('PARTICULARIDADE', 'REGRA_LOCAL', 'PERFIL', 'CONTATO');

-- CreateEnum
CREATE TYPE "StatusMigracao" AS ENUM ('PENDENTE', 'EXTRAIDO', 'IMPORTADO', 'VALIDADO', 'DIVERGENTE');

-- CreateEnum
CREATE TYPE "AcaoHistorico" AS ENUM ('CRIAR', 'ATUALIZAR', 'EXCLUIR');

-- CreateEnum
CREATE TYPE "EstrategiaRisco" AS ENUM ('EVITAR', 'MITIGAR', 'TRANSFERIR', 'ACEITAR');

-- CreateEnum
CREATE TYPE "StatusRisco" AS ENUM ('ABERTO', 'MONITORANDO', 'OCORREU', 'ENCERRADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembroProjeto" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "papel" "PapelProjeto" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembroProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "handoffEm" DATE NOT NULL,
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inicioPrevisto" DATE,
    "fimPrevisto" DATE,
    "fase" "FaseProjeto" NOT NULL DEFAULT 'PLANEJAMENTO',
    "status" "StatusProjeto" NOT NULL DEFAULT 'ATIVO',
    "diaReuniao" INTEGER NOT NULL DEFAULT 4,
    "dataProntidao" DATE,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PessoaCliente" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "departamentoId" TEXT,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "usuarioChave" BOOLEAN NOT NULL DEFAULT false,
    "autonomiaConfirmadaEm" DATE,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PessoaCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaWiki" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "categoria" "CategoriaNota" NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaWiki_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "StatusModulo" NOT NULL DEFAULT 'NAO_INICIADO',
    "percentual" INTEGER NOT NULL DEFAULT 0,
    "aderencia" INTEGER,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarefa" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "moduloId" TEXT,
    "departamentoId" TEXT,
    "responsavelMembroId" TEXT,
    "responsavelPessoaId" TEXT,
    "reuniaoOrigemId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prazo" DATE,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusTarefa" NOT NULL DEFAULT 'A_FAZER',
    "parteResponsavel" "Parte" NOT NULL DEFAULT 'CONTRATADA',
    "motivoBloqueio" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "concluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treinamento" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "moduloId" TEXT,
    "instrutorMembroId" TEXT,
    "titulo" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "horaInicio" TEXT,
    "duracaoMin" INTEGER,
    "local" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treinamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "treinamentoId" TEXT NOT NULL,
    "pessoaClienteId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reuniao" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "tipo" "TipoReuniao" NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "local" TEXT,
    "resumoStatus" TEXT,
    "salvaguardas" TEXT,
    "status" "StatusReuniao" NOT NULL DEFAULT 'RASCUNHO',
    "percentualNoDia" INTEGER,
    "snapshot" JSONB,
    "finalizadaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteReuniao" (
    "id" TEXT NOT NULL,
    "reuniaoId" TEXT NOT NULL,
    "parte" "Parte" NOT NULL,
    "membroId" TEXT,
    "pessoaClienteId" TEXT,
    "nomeAvulso" TEXT,

    CONSTRAINT "ParticipanteReuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decisao" (
    "id" TEXT NOT NULL,
    "reuniaoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "Decisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impedimento" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "reuniaoId" TEXT,
    "categoria" "CategoriaImpedimento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "parteResponsavel" "Parte" NOT NULL,
    "status" "StatusImpedimento" NOT NULL DEFAULT 'ABERTO',
    "abertoEm" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" DATE,
    "resolucao" TEXT,

    CONSTRAINT "Impedimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risco" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "probabilidade" INTEGER NOT NULL,
    "impacto" INTEGER NOT NULL,
    "estrategia" "EstrategiaRisco" NOT NULL,
    "planoResposta" TEXT,
    "responsavelMembroId" TEXT,
    "status" "StatusRisco" NOT NULL DEFAULT 'ABERTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidencia" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "reuniaoId" TEXT,
    "tipo" "TipoEvidencia" NOT NULL,
    "titulo" TEXT NOT NULL,
    "statusAssinatura" "StatusAssinatura" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenciaVersao" (
    "id" TEXT NOT NULL,
    "evidenciaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "assinada" BOOLEAN NOT NULL DEFAULT false,
    "enviadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenciaVersao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaFormalizacao" (
    "id" TEXT NOT NULL,
    "evidenciaId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "enviadoEm" DATE NOT NULL,
    "canal" "Canal" NOT NULL,
    "motivoNaoAssinatura" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TentativaFormalizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioCheckout" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "tipo" "TipoCriterio" NOT NULL,
    "atendido" BOOLEAN NOT NULL DEFAULT false,
    "evidenciaId" TEXT,
    "observacao" TEXT,
    "atendidoEm" TIMESTAMP(3),
    "atendidoPorId" TEXT,

    CONSTRAINT "CriterioCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemMigracao" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "departamentoId" TEXT,
    "evidenciaAceiteId" TEXT,
    "entidade" TEXT NOT NULL,
    "registrosOrigem" INTEGER,
    "registrosImportados" INTEGER,
    "status" "StatusMigracao" NOT NULL DEFAULT 'PENDENTE',
    "justificativa" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemMigracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT,
    "data" DATE NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoAlteracao" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "acao" "AcaoHistorico" NOT NULL,
    "campo" TEXT,
    "valorAnterior" JSONB,
    "valorNovo" JSONB,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoAlteracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MembroProjeto_projetoId_usuarioId_key" ON "MembroProjeto"("projetoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_projetoId_nome_key" ON "Departamento"("projetoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_projetoId_nome_key" ON "Modulo"("projetoId", "nome");

-- CreateIndex
CREATE INDEX "Tarefa_projetoId_status_idx" ON "Tarefa"("projetoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Presenca_treinamentoId_pessoaClienteId_key" ON "Presenca"("treinamentoId", "pessoaClienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Reuniao_projetoId_numero_key" ON "Reuniao"("projetoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Decisao_reuniaoId_numero_key" ON "Decisao"("reuniaoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenciaVersao_evidenciaId_numero_key" ON "EvidenciaVersao"("evidenciaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "CriterioCheckout_projetoId_tipo_key" ON "CriterioCheckout"("projetoId", "tipo");

-- CreateIndex
CREATE INDEX "Feriado_projetoId_data_idx" ON "Feriado"("projetoId", "data");

-- CreateIndex
CREATE INDEX "HistoricoAlteracao_projetoId_criadoEm_idx" ON "HistoricoAlteracao"("projetoId", "criadoEm");

-- CreateIndex
CREATE INDEX "HistoricoAlteracao_entidade_registroId_idx" ON "HistoricoAlteracao"("entidade", "registroId");

-- AddForeignKey
ALTER TABLE "MembroProjeto" ADD CONSTRAINT "MembroProjeto_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroProjeto" ADD CONSTRAINT "MembroProjeto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PessoaCliente" ADD CONSTRAINT "PessoaCliente_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PessoaCliente" ADD CONSTRAINT "PessoaCliente_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaWiki" ADD CONSTRAINT "NotaWiki_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaWiki" ADD CONSTRAINT "NotaWiki_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_responsavelMembroId_fkey" FOREIGN KEY ("responsavelMembroId") REFERENCES "MembroProjeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_responsavelPessoaId_fkey" FOREIGN KEY ("responsavelPessoaId") REFERENCES "PessoaCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_reuniaoOrigemId_fkey" FOREIGN KEY ("reuniaoOrigemId") REFERENCES "Reuniao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treinamento" ADD CONSTRAINT "Treinamento_instrutorMembroId_fkey" FOREIGN KEY ("instrutorMembroId") REFERENCES "MembroProjeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_treinamentoId_fkey" FOREIGN KEY ("treinamentoId") REFERENCES "Treinamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_pessoaClienteId_fkey" FOREIGN KEY ("pessoaClienteId") REFERENCES "PessoaCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteReuniao" ADD CONSTRAINT "ParticipanteReuniao_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "Reuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteReuniao" ADD CONSTRAINT "ParticipanteReuniao_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "MembroProjeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteReuniao" ADD CONSTRAINT "ParticipanteReuniao_pessoaClienteId_fkey" FOREIGN KEY ("pessoaClienteId") REFERENCES "PessoaCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decisao" ADD CONSTRAINT "Decisao_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "Reuniao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impedimento" ADD CONSTRAINT "Impedimento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impedimento" ADD CONSTRAINT "Impedimento_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "Reuniao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risco" ADD CONSTRAINT "Risco_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risco" ADD CONSTRAINT "Risco_responsavelMembroId_fkey" FOREIGN KEY ("responsavelMembroId") REFERENCES "MembroProjeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "Reuniao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaVersao" ADD CONSTRAINT "EvidenciaVersao_evidenciaId_fkey" FOREIGN KEY ("evidenciaId") REFERENCES "Evidencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaVersao" ADD CONSTRAINT "EvidenciaVersao_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaFormalizacao" ADD CONSTRAINT "TentativaFormalizacao_evidenciaId_fkey" FOREIGN KEY ("evidenciaId") REFERENCES "Evidencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaFormalizacao" ADD CONSTRAINT "TentativaFormalizacao_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "PessoaCliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaFormalizacao" ADD CONSTRAINT "TentativaFormalizacao_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioCheckout" ADD CONSTRAINT "CriterioCheckout_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioCheckout" ADD CONSTRAINT "CriterioCheckout_evidenciaId_fkey" FOREIGN KEY ("evidenciaId") REFERENCES "Evidencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMigracao" ADD CONSTRAINT "ItemMigracao_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMigracao" ADD CONSTRAINT "ItemMigracao_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemMigracao" ADD CONSTRAINT "ItemMigracao_evidenciaAceiteId_fkey" FOREIGN KEY ("evidenciaAceiteId") REFERENCES "Evidencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feriado" ADD CONSTRAINT "Feriado_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAlteracao" ADD CONSTRAINT "HistoricoAlteracao_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoAlteracao" ADD CONSTRAINT "HistoricoAlteracao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
