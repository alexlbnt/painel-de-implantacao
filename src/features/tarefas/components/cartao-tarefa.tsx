"use client";

import { CalendarDays, MoreVertical, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { BadgeParte } from "@/components/badge-status";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StatusTarefa } from "@/generated/prisma/enums";
import { formatarData, LABEL_PRIORIDADE, LABEL_STATUS_TAREFA } from "@/lib/formatos";
import { STATUS_TAREFA } from "@/lib/regras/tarefas";
import { tarefaAtrasada } from "@/lib/regras/saude";
import { cn } from "@/lib/utils";
import type { TarefaDaLista } from "../queries";

/** Conteúdo do cartão de tarefa no quadro (sem a lógica de arrastar). */
export function CartaoTarefa({
  tarefa,
  hoje,
  alca,
  editar,
  aoMover,
  arrastando,
}: {
  tarefa: TarefaDaLista;
  hoje: string;
  alca?: ReactNode;
  editar: ReactNode;
  aoMover: (status: StatusTarefa) => void;
  arrastando?: boolean;
}) {
  const atrasada = tarefaAtrasada(tarefa, hoje);
  return (
    <article
      className={cn(
        "space-y-2 rounded-lg border border-line bg-surface p-3 text-sm shadow-sm",
        arrastando && "opacity-60 ring-2 ring-brand-500",
        tarefa.status === "BLOQUEADA" && "border-l-4 border-l-[#991B1B]",
      )}
    >
      <div className="flex items-start gap-1">
        {alca}
        <div className="min-w-0 flex-1">{editar}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Mover "${tarefa.titulo}"`}>
              <MoreVertical aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mover para</DropdownMenuLabel>
            {STATUS_TAREFA.filter((s) => s !== tarefa.status).map((s) => (
              <DropdownMenuItem key={s} onSelect={() => aoMover(s)}>
                {LABEL_STATUS_TAREFA[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {tarefa.modulo || tarefa.departamento ? (
        <p className="text-xs text-muted-foreground">
          {[tarefa.modulo, tarefa.departamento].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {tarefa.status === "BLOQUEADA" && tarefa.motivoBloqueio ? (
        <p className="rounded-md bg-[#FEE2E2] px-2 py-1 text-xs text-[#991B1B]">
          <span className="font-semibold">Bloqueada: </span>
          {tarefa.motivoBloqueio}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <BadgeParte parte={tarefa.parteResponsavel} />
        {tarefa.prazo ? (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              atrasada && "font-semibold text-danger",
            )}
          >
            <CalendarDays className="size-3.5" aria-hidden />
            {formatarData(tarefa.prazo)}
            {atrasada ? " (atrasada)" : null}
          </span>
        ) : null}
        {tarefa.responsavelNome ? (
          <span className="inline-flex min-w-0 items-center gap-1">
            <UserRound className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{tarefa.responsavelNome}</span>
          </span>
        ) : null}
        {tarefa.prioridade === "ALTA" ? (
          <span className="font-semibold text-ink">
            Prioridade {LABEL_PRIORIDADE.ALTA.toLowerCase()}
          </span>
        ) : null}
      </div>
    </article>
  );
}
