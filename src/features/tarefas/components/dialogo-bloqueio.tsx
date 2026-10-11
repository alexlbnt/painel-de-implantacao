"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { validarBloqueio } from "@/lib/regras/tarefas";

/** Diálogo controlado que pede o motivo ao bloquear uma tarefa (RN11). Recriado a cada uso via `key`. */
export function DialogoBloqueio({
  aberto,
  titulo,
  aoConfirmar,
  aoCancelar,
  pendente,
}: {
  aberto: boolean;
  titulo: string;
  aoConfirmar: (motivo: string) => void;
  aoCancelar: () => void;
  pendente?: boolean;
}) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const id = useId();

  return (
    <Dialog open={aberto} onOpenChange={(v) => (!v ? aoCancelar() : undefined)}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const problema = validarBloqueio("BLOQUEADA", motivo);
            setErro(problema);
            if (!problema) aoConfirmar(motivo.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>Bloquear tarefa</DialogTitle>
            <DialogDescription>
              &ldquo;{titulo}&rdquo; vai para Bloqueada. Toda tarefa bloqueada precisa de um motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium">
              Motivo do bloqueio
            </label>
            <Textarea
              id={id}
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              aria-invalid={!!erro}
              aria-describedby={erro ? `${id}-erro` : undefined}
              autoFocus
            />
            {erro ? (
              <p id={`${id}-erro`} role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={aoCancelar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Bloqueando…" : "Bloquear tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
