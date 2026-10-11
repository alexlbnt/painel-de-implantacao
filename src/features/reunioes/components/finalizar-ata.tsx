"use client";

import { Lock } from "lucide-react";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { tratarResultado } from "@/lib/acao-cliente";
import { finalizarReuniao } from "../actions";

/** Finalizar ata (só Líder): congela o conteúdo. O servidor revalida RN07 e RN08. */
export function FinalizarAta({
  projetoId,
  reuniaoId,
  pendencias,
}: {
  projetoId: string;
  reuniaoId: string;
  pendencias: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  return (
    <AlertDialog open={aberto} onOpenChange={setAberto}>
      <AlertDialogTrigger asChild>
        <Button>
          <Lock aria-hidden />
          Finalizar ata
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalizar a ata?</AlertDialogTitle>
          <AlertDialogDescription>
            O conteúdo fica congelado: participantes, resumo, ações, impedimentos, decisões e
            salvaguardas não mudam mais, mesmo que as tarefas mudem depois. O percentual do projeto
            de hoje é gravado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pendencias ? (
          <p role="alert" className="rounded-md bg-[#FEE2E2] px-3 py-2 text-sm text-[#991B1B]">
            {pendencias}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pendente || !!pendencias}
            onClick={(e) => {
              e.preventDefault();
              iniciar(async () => {
                const r = await finalizarReuniao({ projetoId, reuniaoId });
                if (tratarResultado(r, { sucesso: "Ata finalizada." })) setAberto(false);
              });
            }}
          >
            {pendente ? "Finalizando…" : "Finalizar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
