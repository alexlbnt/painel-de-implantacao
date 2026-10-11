"use client";

import { useState, useTransition, type ReactNode } from "react";
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
import { tratarResultado } from "@/lib/acao-cliente";
import type { Resultado } from "@/lib/resultado";

/** Confirmação para ações destrutivas (AlertDialog, não Dialog). */
export function ConfirmarAcao({
  gatilho,
  titulo,
  descricao,
  rotuloConfirmar = "Confirmar",
  sucesso,
  aoConfirmar,
}: {
  gatilho: ReactNode;
  titulo: string;
  descricao: ReactNode;
  rotuloConfirmar?: string;
  sucesso: string;
  aoConfirmar: () => Promise<Resultado<unknown>>;
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();

  return (
    <AlertDialog open={aberto} onOpenChange={setAberto}>
      <AlertDialogTrigger asChild>{gatilho}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pendente}
            onClick={(e) => {
              e.preventDefault();
              iniciar(async () => {
                if (tratarResultado(await aoConfirmar(), { sucesso })) setAberto(false);
              });
            }}
          >
            {pendente ? "Aguarde…" : rotuloConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
