"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CampoTextoLongo } from "@/components/campo-formulario";
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
import { tratarResultado } from "@/lib/acao-cliente";
import type { Resultado } from "@/lib/resultado";
import { motivo } from "@/lib/validacao";

const schema = z.object({ motivo });
type Dados = z.input<typeof schema>;

type Props = {
  gatilho: ReactNode;
  titulo: string;
  descricao?: ReactNode;
  rotuloMotivo?: string;
  rotuloConfirmar: string;
  sucesso: string;
  perigo?: boolean;
  aoConfirmar: (motivo: string) => Promise<Resultado<unknown>>;
};

/** Diálogo com motivo obrigatório (mín. 10 caracteres), usado em mudanças que vão para o histórico. */
export function DialogoMotivo({
  gatilho,
  titulo,
  descricao,
  rotuloMotivo = "Motivo",
  rotuloConfirmar,
  sucesso,
  perigo,
  aoConfirmar,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: { motivo: "" } });

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await aoConfirmar(dados.motivo);
      if (tratarResultado(r, { sucesso, setError: form.setError })) {
        form.reset();
        setAberto(false);
      }
    }),
  );

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (!v) form.reset();
      }}
    >
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {descricao ? <DialogDescription>{descricao}</DialogDescription> : null}
          </DialogHeader>
          <CampoTextoLongo
            id="motivo"
            rotulo={rotuloMotivo}
            rows={4}
            descricao="Mínimo de 10 caracteres. Fica registrado no histórico."
            erro={form.formState.errors.motivo}
            {...form.register("motivo")}
          />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant={perigo ? "destructive" : "default"} disabled={pendente}>
              {pendente ? "Salvando…" : rotuloConfirmar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
