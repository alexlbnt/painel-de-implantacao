"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { BadgeStatusProjeto } from "@/components/badge-status";
import { CampoSelecao, CampoTextoLongo, opcoesDe } from "@/components/campo-formulario";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import type { StatusProjeto } from "@/generated/prisma/enums";
import { tratarResultado } from "@/lib/acao-cliente";
import { LABEL_STATUS_PROJETO } from "@/lib/formatos";
import { alterarStatusProjeto } from "../actions";
import { alterarStatusSchema, type AlterarStatusInput } from "../schemas";

export function AlterarStatus({
  projetoId,
  status,
  podeEditar,
}: {
  projetoId: string;
  status: StatusProjeto;
  podeEditar: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const form = useForm<AlterarStatusInput>({
    resolver: zodResolver(alterarStatusSchema),
    defaultValues: { projetoId, status, motivo: "" },
  });

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await alterarStatusProjeto(dados);
      if (tratarResultado(r, { sucesso: "Status do projeto alterado.", setError: form.setError })) {
        setAberto(false);
      }
    }),
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm">
        Status atual: <BadgeStatusProjeto status={status} />
      </p>
      {podeEditar ? (
        <Dialog
          open={aberto}
          onOpenChange={(v) => {
            setAberto(v);
            if (v) form.reset({ projetoId, status, motivo: "" });
          }}
        >
          <DialogTrigger asChild>
            <Button variant="secondary">Alterar status</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={enviar} noValidate className="space-y-4">
              <DialogHeader>
                <DialogTitle>Alterar status do projeto</DialogTitle>
                <DialogDescription>
                  O status é independente da fase e fica registrado no histórico.
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <CampoSelecao
                  id="novo-status"
                  rotulo="Novo status"
                  opcoes={opcoesDe(LABEL_STATUS_PROJETO)}
                  erro={form.formState.errors.status}
                  {...form.register("status")}
                />
                <CampoTextoLongo
                  id="motivo-status"
                  rotulo="Motivo"
                  rows={3}
                  descricao="Mínimo de 10 caracteres."
                  erro={form.formState.errors.motivo}
                  {...form.register("motivo")}
                />
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pendente}>
                  {pendente ? "Salvando…" : "Alterar status"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
