import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import type {
  AcaoHistorico,
  Canal,
  CategoriaImpedimento,
  CategoriaNota,
  EstrategiaRisco,
  FaseProjeto,
  PapelProjeto,
  Parte,
  Prioridade,
  StatusAssinatura,
  StatusImpedimento,
  StatusMigracao,
  StatusModulo,
  StatusProjeto,
  StatusReuniao,
  StatusRisco,
  StatusTarefa,
  TipoCriterio,
  TipoEvidencia,
  TipoReuniao,
} from "@/generated/prisma/enums";
import { FUSO_HORARIO } from "./constantes";
import type { Saude } from "./regras/saude";

// Formatos de exibição (RNF09): datas dd/MM/yyyy no fuso America/Sao_Paulo e números pt-BR.

/** Data sem hora ("YYYY-MM-DD" ou Date de coluna @db.Date, meia-noite UTC) → dd/MM/yyyy. */
export function formatarData(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const iso = typeof valor === "string" ? valor.slice(0, 10) : valor.toISOString().slice(0, 10);
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Instante (DateTime) → dd/MM/yyyy HH:mm no fuso de exibição. */
export function formatarDataHora(valor: Date | null | undefined): string {
  if (!valor) return "—";
  return formatInTimeZone(valor, FUSO_HORARIO, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/** "Hoje" no fuso de exibição, como "YYYY-MM-DD" (usado pelas regras de prazo). */
export function hojeISO(agora: Date = new Date()): string {
  return formatInTimeZone(agora, FUSO_HORARIO, "yyyy-MM-dd");
}

const numero = new Intl.NumberFormat("pt-BR");

export function formatarNumero(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "—" : numero.format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${numero.format(valor)}%`;
}

/** Plural simples em português: 1 tarefa / 2 tarefas. */
export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return `${formatarNumero(n)} ${n === 1 ? singular : pluralForma}`;
}

// ---------------------------------------------------------------
// Labels dos enums (seção 12: "Labels em português ficam em lib/formatos.ts")
// ---------------------------------------------------------------

export const LABEL_PAPEL: Record<PapelProjeto, string> = { LIDER: "Líder", ANALISTA: "Analista" };

export const LABEL_FASE: Record<FaseProjeto, string> = {
  PLANEJAMENTO: "Planejamento",
  EXECUCAO: "Execução",
  CHECKOUT: "Check-out",
  HANDOVER: "Handover",
  TRANSICAO: "Transição",
  ENCERRADO: "Encerrado",
};

export const LABEL_STATUS_PROJETO: Record<StatusProjeto, string> = {
  ATIVO: "Ativo",
  AGUARDANDO_PRONTIDAO: "Aguardando prontidão",
  PAUSADO: "Pausado",
  CANCELADO: "Cancelado",
};

export const LABEL_PARTE: Record<Parte, string> = {
  CONTRATADA: "Contratada",
  CONTRATANTE: "Contratante",
};

export const LABEL_STATUS_MODULO: Record<StatusModulo, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_IMPLANTACAO: "Em implantação",
  EM_VALIDACAO: "Em validação",
  IMPLANTADO: "Implantado",
};

export const LABEL_STATUS_TAREFA: Record<StatusTarefa, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  BLOQUEADA: "Bloqueada",
  CONCLUIDA: "Concluída",
};

export const LABEL_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const LABEL_TIPO_REUNIAO: Record<TipoReuniao, string> = {
  KICKOFF: "Kickoff",
  SEMANAL: "Semanal",
  PRONTIDAO: "Prontidão",
};

export const LABEL_STATUS_REUNIAO: Record<StatusReuniao, string> = {
  RASCUNHO: "Rascunho",
  FINALIZADA: "Finalizada",
};

export const LABEL_CATEGORIA_IMPEDIMENTO: Record<CategoriaImpedimento, string> = {
  INFRAESTRUTURA_CLIENTE: "Infraestrutura do cliente",
  PESSOAL_CHAVE: "Pessoal-chave",
  DADOS_LEGADOS: "Dados legados",
  OUTRO: "Outro",
};

export const LABEL_STATUS_IMPEDIMENTO: Record<StatusImpedimento, string> = {
  ABERTO: "Aberto",
  RESOLVIDO: "Resolvido",
};

export const LABEL_TIPO_EVIDENCIA: Record<TipoEvidencia, string> = {
  ATA_ABERTURA: "Ata de abertura",
  TERMO_DADOS_LEGADOS: "Termo de dados legados",
  ATA_SEMANAL: "Ata semanal",
  TERMO_ACEITE_MIGRACAO: "Termo de aceite da migração",
  CHECKLIST: "Checklist",
  ATA_PRONTIDAO: "Ata de prontidão",
  OUTRO: "Outro",
};

export const LABEL_STATUS_ASSINATURA: Record<StatusAssinatura, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  ASSINADO: "Assinado",
  RECUSADO: "Recusado",
  ACEITE_TACITO: "Aceite tácito",
};

export const LABEL_CANAL: Record<Canal, string> = {
  EMAIL: "E-mail",
  MENSAGEM: "Mensagem",
  PRESENCIAL: "Presencial",
  OUTRO: "Outro",
};

export const LABEL_CRITERIO: Record<TipoCriterio, string> = {
  SALDOS_INICIAIS_ACEITOS: "Saldos iniciais aceitos",
  AUTONOMIA_USUARIOS_CHAVE: "Autonomia dos usuários-chave",
  INTEGRACOES_OBRIGATORIAS_ATIVAS: "Integrações obrigatórias ativas",
  WIKI_CONSOLIDADA: "Wiki do cliente consolidada",
};

export const LABEL_CATEGORIA_NOTA: Record<CategoriaNota, string> = {
  PARTICULARIDADE: "Particularidades",
  REGRA_LOCAL: "Regras locais",
  PERFIL: "Perfis",
  CONTATO: "Contatos",
};

export const LABEL_STATUS_MIGRACAO: Record<StatusMigracao, string> = {
  PENDENTE: "Pendente",
  EXTRAIDO: "Extraído",
  IMPORTADO: "Importado",
  VALIDADO: "Validado",
  DIVERGENTE: "Divergente",
};

export const LABEL_ACAO_HISTORICO: Record<AcaoHistorico, string> = {
  CRIAR: "Criou",
  ATUALIZAR: "Alterou",
  EXCLUIR: "Excluiu",
};

export const LABEL_ESTRATEGIA_RISCO: Record<EstrategiaRisco, string> = {
  EVITAR: "Evitar",
  MITIGAR: "Mitigar",
  TRANSFERIR: "Transferir",
  ACEITAR: "Aceitar",
};

export const LABEL_STATUS_RISCO: Record<StatusRisco, string> = {
  ABERTO: "Aberto",
  MONITORANDO: "Monitorando",
  OCORREU: "Ocorreu",
  ENCERRADO: "Encerrado",
};

export const LABEL_SAUDE: Record<Saude, string> = {
  EM_DIA: "Em dia",
  ATENCAO: "Atenção",
  CRITICO: "Crítico",
};

/** Dia da reunião: 1 = segunda … 5 = sexta (Projeto.diaReuniao). */
export const LABEL_DIA_SEMANA: Record<number, string> = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
};

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
] as const;

/** Nome legível das entidades gravadas no histórico. */
export const LABEL_ENTIDADE: Record<string, string> = {
  Projeto: "Projeto",
  MembroProjeto: "Equipe",
  PessoaCliente: "Pessoa do cliente",
  Departamento: "Departamento",
  Feriado: "Feriado",
  Modulo: "Módulo",
  Tarefa: "Tarefa",
  Reuniao: "Reunião",
  Impedimento: "Impedimento",
  Evidencia: "Evidência",
  CriterioCheckout: "Critério de check-out",
  Treinamento: "Treinamento",
  NotaWiki: "Wiki",
  ItemMigracao: "Migração",
  Risco: "Risco",
};
