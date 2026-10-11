import type { ReactNode } from "react";
import type {
  FaseProjeto,
  Parte,
  StatusAssinatura,
  StatusImpedimento,
  StatusMigracao,
  StatusModulo,
  StatusProjeto,
  StatusReuniao,
  StatusRisco,
  StatusTarefa,
} from "@/generated/prisma/enums";
import {
  LABEL_FASE,
  LABEL_PAPEL,
  LABEL_PARTE,
  LABEL_SAUDE,
  LABEL_STATUS_ASSINATURA,
  LABEL_STATUS_IMPEDIMENTO,
  LABEL_STATUS_MIGRACAO,
  LABEL_STATUS_MODULO,
  LABEL_STATUS_PROJETO,
  LABEL_STATUS_REUNIAO,
  LABEL_STATUS_RISCO,
  LABEL_STATUS_TAREFA,
} from "@/lib/formatos";
import type { Saude } from "@/lib/regras/saude";
import { cn } from "@/lib/utils";

// Badges de status (seção 12). Todo badge tem texto, nunca só cor.
export type Tom =
  "verde" | "amarelo" | "vermelho" | "neutro" | "indigo" | "contratada" | "contratante";

const CLASSES_TOM: Record<Tom, string> = {
  verde: "bg-brand-100 text-brand-900 border-transparent",
  amarelo: "bg-[#FEF3C7] text-[#92400E] border-transparent",
  vermelho: "bg-[#FEE2E2] text-[#991B1B] border-transparent",
  neutro: "bg-[#F1F5F9] text-[#334155] border-transparent",
  indigo: "bg-[#E0E7FF] text-[#3730A3] border-transparent",
  contratada: "bg-brand-50 text-brand-900 border-brand-300",
  contratante: "bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]",
};

export function Badge({
  tom,
  children,
  className,
}: {
  tom: Tom;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        CLASSES_TOM[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

const TOM_SAUDE: Record<Saude, Tom> = { EM_DIA: "verde", ATENCAO: "amarelo", CRITICO: "vermelho" };
const TOM_STATUS_TAREFA: Record<StatusTarefa, Tom> = {
  A_FAZER: "neutro",
  EM_ANDAMENTO: "amarelo",
  BLOQUEADA: "vermelho",
  CONCLUIDA: "verde",
};
const TOM_STATUS_MODULO: Record<StatusModulo, Tom> = {
  NAO_INICIADO: "neutro",
  EM_IMPLANTACAO: "amarelo",
  EM_VALIDACAO: "amarelo",
  IMPLANTADO: "verde",
};
const TOM_ASSINATURA: Record<StatusAssinatura, Tom> = {
  RASCUNHO: "neutro",
  ENVIADO: "amarelo",
  ASSINADO: "verde",
  RECUSADO: "vermelho",
  ACEITE_TACITO: "indigo",
};
const TOM_MIGRACAO: Record<StatusMigracao, Tom> = {
  PENDENTE: "neutro",
  EXTRAIDO: "amarelo",
  IMPORTADO: "amarelo",
  VALIDADO: "verde",
  DIVERGENTE: "vermelho",
};
const TOM_STATUS_PROJETO: Record<StatusProjeto, Tom> = {
  ATIVO: "verde",
  AGUARDANDO_PRONTIDAO: "amarelo",
  PAUSADO: "neutro",
  CANCELADO: "vermelho",
};
const TOM_RISCO: Record<StatusRisco, Tom> = {
  ABERTO: "amarelo",
  MONITORANDO: "neutro",
  OCORREU: "vermelho",
  ENCERRADO: "verde",
};

export function BadgeFase({ fase }: { fase: FaseProjeto }) {
  return <Badge tom="verde">{LABEL_FASE[fase]}</Badge>;
}
export function BadgeSaude({ saude }: { saude: Saude }) {
  return <Badge tom={TOM_SAUDE[saude]}>{LABEL_SAUDE[saude]}</Badge>;
}
export function BadgeStatusProjeto({ status }: { status: StatusProjeto }) {
  return <Badge tom={TOM_STATUS_PROJETO[status]}>{LABEL_STATUS_PROJETO[status]}</Badge>;
}
export function BadgeParte({ parte }: { parte: Parte }) {
  return (
    <Badge tom={parte === "CONTRATADA" ? "contratada" : "contratante"}>{LABEL_PARTE[parte]}</Badge>
  );
}
export function BadgePapel({ papel }: { papel: "LIDER" | "ANALISTA" }) {
  return <Badge tom={papel === "LIDER" ? "verde" : "neutro"}>{LABEL_PAPEL[papel]}</Badge>;
}
export function BadgeStatusTarefa({ status }: { status: StatusTarefa }) {
  return <Badge tom={TOM_STATUS_TAREFA[status]}>{LABEL_STATUS_TAREFA[status]}</Badge>;
}
export function BadgeStatusModulo({ status }: { status: StatusModulo }) {
  return <Badge tom={TOM_STATUS_MODULO[status]}>{LABEL_STATUS_MODULO[status]}</Badge>;
}
export function BadgeAssinatura({ status }: { status: StatusAssinatura }) {
  return <Badge tom={TOM_ASSINATURA[status]}>{LABEL_STATUS_ASSINATURA[status]}</Badge>;
}
export function BadgeMigracao({ status }: { status: StatusMigracao }) {
  return <Badge tom={TOM_MIGRACAO[status]}>{LABEL_STATUS_MIGRACAO[status]}</Badge>;
}
export function BadgeStatusReuniao({ status }: { status: StatusReuniao }) {
  return (
    <Badge tom={status === "FINALIZADA" ? "verde" : "neutro"}>{LABEL_STATUS_REUNIAO[status]}</Badge>
  );
}
export function BadgeImpedimento({ status }: { status: StatusImpedimento }) {
  return (
    <Badge tom={status === "ABERTO" ? "vermelho" : "verde"}>
      {LABEL_STATUS_IMPEDIMENTO[status]}
    </Badge>
  );
}
export function BadgeRisco({ status }: { status: StatusRisco }) {
  return <Badge tom={TOM_RISCO[status]}>{LABEL_STATUS_RISCO[status]}</Badge>;
}
