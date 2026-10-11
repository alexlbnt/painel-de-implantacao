"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { CampoSelecao, CampoTexto } from "@/components/campo-formulario";
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
import { tratarResultado } from "@/lib/acao-cliente";
import { LABEL_DIA_SEMANA } from "@/lib/formatos";
import { criarReuniao } from "../actions";
import { criarReuniaoSchema, type CriarReuniaoInput } from "../schemas";

export function DialogoNovaReuniao({
  projetoId,
  dataSugerida,
  diaReuniao,
  proximoNumero,
}: {
  projetoId: string;
  dataSugerida: string;
  diaReuniao: number;
  proximoNumero: number;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const inicial: CriarReuniaoInput = { projetoId, tipo: "SEMANAL", data: dataSugerida };
  const form = useForm<CriarReuniaoInput>({
    resolver: zodResolver(criarReuniaoSchema),
    defaultValues: inicial,
  });

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await criarReuniao(dados);
      if (
        tratarResultado(r, {
          sucesso: `Reunião nº ${proximoNumero} criada.`,
          setError: form.setError,
        })
      ) {
        setAberto(false);
        router.push(`/projetos/${projetoId}/reunioes/${r.data.id}`);
      }
    }),
  );

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v) form.reset(inicial);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          Nova reunião semanal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nova reunião nº {proximoNumero}</DialogTitle>
            <DialogDescription>
              A data sugerida é a próxima {LABEL_DIA_SEMANA[diaReuniao]?.toLowerCase()}, o dia
              configurado para a reunião semanal.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <CampoSelecao
              id="reuniao-tipo"
              rotulo="Tipo"
              opcoes={[
                { valor: "SEMANAL", rotulo: "Semanal de governança" },
                { valor: "KICKOFF", rotulo: "Kickoff (abertura)" },
              ]}
              {...form.register("tipo")}
            />
            <CampoTexto
              id="reuniao-data"
              rotulo="Data"
              type="date"
              erro={form.formState.errors.data}
              {...form.register("data")}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Criando…" : "Criar e abrir a ata"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
