import Link from "next/link";
import { BadgeFase, BadgePapel, BadgeSaude, BadgeStatusProjeto } from "@/components/badge-status";
import { Progress } from "@/components/ui/progress";
import { LABEL_FASE, formatarPercentual, plural } from "@/lib/formatos";
import type { ProjetoDaLista } from "../queries";

export function CardProjeto({ projeto }: { projeto: ProjetoDaLista }) {
  return (
    <Link
      href={`/projetos/${projeto.id}`}
      className="group flex h-full flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm transition-colors hover:border-brand-500"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 text-base font-semibold text-ink group-hover:text-brand-800">
            {projeto.nome}
          </h2>
          <BadgePapel papel={projeto.papel} />
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {projeto.cliente} · {projeto.municipio}/{projeto.uf}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <BadgeFase fase={projeto.fase} />
        <BadgeSaude saude={projeto.saude} />
        {projeto.status !== "ATIVO" ? <BadgeStatusProjeto status={projeto.status} /> : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold">{formatarPercentual(projeto.percentual)}</span>
        </div>
        <Progress value={projeto.percentual} aria-label={`Progresso de ${projeto.percentual}%`} />
      </div>

      <p className="mt-auto border-t border-line pt-3 text-sm">
        <span className="text-muted-foreground">Próximo marco: </span>
        {projeto.proximoMarco ? (
          <>
            <span className="font-medium">{LABEL_FASE[projeto.proximoMarco.fase]}</span>
            <span className="text-muted-foreground">
              {projeto.proximoMarco.pendentes === 0
                ? " · portão liberado"
                : ` · ${plural(projeto.proximoMarco.pendentes, "pendência")}`}
            </span>
          </>
        ) : (
          <span className="font-medium">Projeto encerrado</span>
        )}
      </p>
    </Link>
  );
}
