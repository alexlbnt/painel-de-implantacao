// Ciclo de vida da implantação (seção 4). Fases fixas, em ordem, com portões validados no servidor.
import { diasCorridosEntre, type DataISO } from "./diasUteis";

export const FASES = [
  "PLANEJAMENTO",
  "EXECUCAO",
  "CHECKOUT",
  "HANDOVER",
  "TRANSICAO",
  "ENCERRADO",
] as const;
export type Fase = (typeof FASES)[number];

/** RN06 / A3: transição dura 20 dias corridos a partir do D+0. */
export const DIAS_CORRIDOS_TRANSICAO = 20;
/** Toda mudança de fase exige motivo com pelo menos 10 caracteres. */
export const MOTIVO_MIN_CARACTERES = 10;

export type TipoEvidenciaPortao =
  | "ATA_ABERTURA"
  | "TERMO_DADOS_LEGADOS"
  | "ATA_SEMANAL"
  | "TERMO_ACEITE_MIGRACAO"
  | "CHECKLIST"
  | "ATA_PRONTIDAO"
  | "OUTRO";
export type StatusAssinaturaPortao =
  "RASCUNHO" | "ENVIADO" | "ASSINADO" | "RECUSADO" | "ACEITE_TACITO";
export type TipoCriterioPortao =
  | "SALDOS_INICIAIS_ACEITOS"
  | "AUTONOMIA_USUARIOS_CHAVE"
  | "INTEGRACOES_OBRIGATORIAS_ATIVAS"
  | "WIKI_CONSOLIDADA";

/** Aba do projeto onde o item pendente se resolve (vira link na tela de fases). */
export type AbaPortao = "evidencias" | "modulos" | "checkout" | "reunioes" | "fases";

export type ItemPortao = {
  chave: string;
  descricao: string;
  atendido: boolean;
  aba: AbaPortao;
};

export type DadosPortao = {
  evidencias: readonly { tipo: TipoEvidenciaPortao; statusAssinatura: StatusAssinaturaPortao }[];
  totalModulos: number;
  criterios: readonly { tipo: TipoCriterioPortao; atendido: boolean }[];
  reuniaoProntidaoFinalizada: boolean;
  dataProntidao: DataISO | null;
  hoje: DataISO;
};

const DESCRICAO_CRITERIO: Record<TipoCriterioPortao, string> = {
  SALDOS_INICIAIS_ACEITOS: "Critério atendido: saldos iniciais aceitos",
  AUTONOMIA_USUARIOS_CHAVE: "Critério atendido: autonomia dos usuários-chave",
  INTEGRACOES_OBRIGATORIAS_ATIVAS: "Critério atendido: integrações obrigatórias ativas",
  WIKI_CONSOLIDADA: "Critério atendido: wiki do cliente consolidada",
};

export const ORDEM_CRITERIOS: readonly TipoCriterioPortao[] = [
  "SALDOS_INICIAIS_ACEITOS",
  "AUTONOMIA_USUARIOS_CHAVE",
  "INTEGRACOES_OBRIGATORIAS_ATIVAS",
  "WIKI_CONSOLIDADA",
];

export function proximaFase(fase: Fase): Fase | null {
  const i = FASES.indexOf(fase);
  return i < FASES.length - 1 ? FASES[i + 1] : null;
}

export function faseAnterior(fase: Fase): Fase | null {
  const i = FASES.indexOf(fase);
  return i > 0 ? FASES[i - 1] : null;
}

/** RN02 + RN04: evidência de kickoff vale se não estiver em RASCUNHO. */
function temEvidenciaEnviada(dados: DadosPortao, tipo: TipoEvidenciaPortao): boolean {
  return dados.evidencias.some((e) => e.tipo === tipo && e.statusAssinatura !== "RASCUNHO");
}

/** Dias corridos que faltam para encerrar a transição (0 quando já pode encerrar). */
export function diasRestantesTransicao(dataProntidao: DataISO, hoje: DataISO): number {
  return Math.max(0, DIAS_CORRIDOS_TRANSICAO - diasCorridosEntre(dataProntidao, hoje));
}

/** Checklist do portão para sair da fase `atual` para a próxima ("o que falta para avançar"). */
export function itensDoPortao(atual: Fase, dados: DadosPortao): ItemPortao[] {
  switch (atual) {
    case "PLANEJAMENTO":
      return [
        {
          chave: "ATA_ABERTURA",
          descricao: "Ata de abertura enviada ou formalizada",
          atendido: temEvidenciaEnviada(dados, "ATA_ABERTURA"),
          aba: "evidencias",
        },
        {
          chave: "TERMO_DADOS_LEGADOS",
          descricao: "Termo de recebimento dos dados legados enviado ou formalizado",
          atendido: temEvidenciaEnviada(dados, "TERMO_DADOS_LEGADOS"),
          aba: "evidencias",
        },
      ];
    case "EXECUCAO":
      return [
        {
          chave: "MODULOS",
          descricao: "Pelo menos 1 módulo cadastrado",
          atendido: dados.totalModulos >= 1,
          aba: "modulos",
        },
      ];
    case "CHECKOUT":
      return ORDEM_CRITERIOS.map((tipo) => ({
        chave: tipo,
        descricao: DESCRICAO_CRITERIO[tipo],
        atendido: dados.criterios.some((c) => c.tipo === tipo && c.atendido),
        aba: "checkout" as const,
      }));
    case "HANDOVER":
      return [
        {
          chave: "PRONTIDAO",
          descricao: "Reunião de prontidão finalizada",
          atendido: dados.reuniaoProntidaoFinalizada,
          aba: "reunioes",
        },
      ];
    case "TRANSICAO": {
      const restantes = dados.dataProntidao
        ? diasRestantesTransicao(dados.dataProntidao, dados.hoje)
        : DIAS_CORRIDOS_TRANSICAO;
      return [
        {
          chave: "TRANSICAO_20_DIAS",
          descricao:
            restantes === 0
              ? `${DIAS_CORRIDOS_TRANSICAO} dias corridos desde o D+0`
              : `${DIAS_CORRIDOS_TRANSICAO} dias corridos desde o D+0 (faltam ${restantes})`,
          atendido: dados.dataProntidao !== null && restantes === 0,
          aba: "fases",
        },
      ];
    }
    case "ENCERRADO":
      return [];
  }
}

export type ResultadoTransicao =
  { ok: true; destino: Fase } | { ok: false; erro: string; pendentes?: ItemPortao[] };

export function avaliarAvanco(atual: Fase, dados: DadosPortao): ResultadoTransicao {
  const destino = proximaFase(atual);
  if (!destino) return { ok: false, erro: "O projeto já está encerrado." };
  const pendentes = itensDoPortao(atual, dados).filter((i) => !i.atendido);
  if (pendentes.length > 0) {
    return {
      ok: false,
      erro: `Ainda não é possível avançar: ${pendentes.map((p) => p.descricao.toLowerCase()).join("; ")}.`,
      pendentes,
    };
  }
  return { ok: true, destino };
}

/** Retroceder uma fase: permitido ao Líder, exceto a partir de ENCERRADO. */
export function avaliarRetrocesso(atual: Fase): ResultadoTransicao {
  if (atual === "ENCERRADO") {
    return { ok: false, erro: "Um projeto encerrado não pode voltar de fase." };
  }
  const destino = faseAnterior(atual);
  if (!destino) return { ok: false, erro: "O projeto já está na primeira fase." };
  return { ok: true, destino };
}

export function validarMotivo(motivo: string): string | null {
  return motivo.trim().length >= MOTIVO_MIN_CARACTERES
    ? null
    : `Explique o motivo com pelo menos ${MOTIVO_MIN_CARACTERES} caracteres.`;
}
