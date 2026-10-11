"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { CampoSelecao, CampoTexto, CampoTextoLongo, opcoesDe } from "@/components/campo-formulario";
import { ConfirmarAcao } from "@/components/confirmar-acao";
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
import { FieldError, FieldGroup, FieldLabel, Field } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { tratarResultado } from "@/lib/acao-cliente";
import { LABEL_PARTE, LABEL_PRIORIDADE, LABEL_STATUS_TAREFA } from "@/lib/formatos";
import { excluirTarefa, salvarTarefa } from "../actions";
import type { OpcoesTarefa, TarefaDaLista } from "../queries";
import { tarefaSchema, type TarefaInput } from "../schemas";

function valoresIniciais(
  projetoId: string,
  t?: TarefaDaLista,
  statusInicial?: TarefaInput["status"],
): TarefaInput {
  return {
    projetoId,
    tarefaId: t?.id,
    titulo: t?.titulo ?? "",
    descricao: t?.descricao ?? "",
    moduloId: t?.moduloId ?? "",
    departamentoId: t?.departamentoId ?? "",
    responsavel: t?.responsavel ?? "",
    prazo: t?.prazo ?? "",
    prioridade: t?.prioridade ?? "MEDIA",
    parteResponsavel: t?.parteResponsavel ?? "CONTRATADA",
    status: t?.status ?? statusInicial ?? "A_FAZER",
    motivoBloqueio: t?.motivoBloqueio ?? "",
  };
}

export function DialogoTarefa({
  projetoId,
  opcoes,
  tarefa,
  gatilho,
  statusInicial,
}: {
  projetoId: string;
  opcoes: OpcoesTarefa;
  tarefa?: TarefaDaLista;
  gatilho: ReactNode;
  statusInicial?: TarefaInput["status"];
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const form = useForm<TarefaInput, unknown, z.output<typeof tarefaSchema>>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: valoresIniciais(projetoId, tarefa, statusInicial),
  });
  const { errors } = form.formState;
  const status = useWatch({ control: form.control, name: "status" });

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await salvarTarefa(dados);
      if (
        tratarResultado(r, {
          sucesso: tarefa ? "Tarefa atualizada." : "Tarefa criada.",
          setError: form.setError,
        })
      ) {
        setAberto(false);
      }
    }),
  );

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v) form.reset(valoresIniciais(projetoId, tarefa, statusInicial));
      }}
    >
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{tarefa ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
            <DialogDescription>
              {tarefa?.reuniaoNumero
                ? `Ação criada na reunião nº ${tarefa.reuniaoNumero}.`
                : "Tarefa por módulo e departamento, com responsável, prazo e parte responsável."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <CampoTexto
              id="tarefa-titulo"
              rotulo="Título"
              erro={errors.titulo}
              {...form.register("titulo")}
            />
            <CampoTextoLongo
              id="tarefa-descricao"
              rotulo="Descrição (opcional)"
              rows={3}
              erro={errors.descricao}
              {...form.register("descricao")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelecao
                id="tarefa-modulo"
                rotulo="Módulo"
                vazio="Sem módulo"
                opcoes={opcoes.modulos}
                {...form.register("moduloId")}
              />
              <CampoSelecao
                id="tarefa-departamento"
                rotulo="Departamento"
                vazio="Sem departamento"
                opcoes={opcoes.departamentos}
                {...form.register("departamentoId")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.responsavel}>
                <FieldLabel htmlFor="tarefa-responsavel">Responsável</FieldLabel>
                <NativeSelect id="tarefa-responsavel" {...form.register("responsavel")}>
                  <NativeSelectOption value="">Sem responsável</NativeSelectOption>
                  <NativeSelectOptGroup label="Equipe (contratada)">
                    {opcoes.responsaveis.equipe.map((o) => (
                      <NativeSelectOption key={o.valor} value={o.valor}>
                        {o.rotulo}
                      </NativeSelectOption>
                    ))}
                  </NativeSelectOptGroup>
                  <NativeSelectOptGroup label="Cliente (contratante)">
                    {opcoes.responsaveis.cliente.map((o) => (
                      <NativeSelectOption key={o.valor} value={o.valor}>
                        {o.rotulo}
                      </NativeSelectOption>
                    ))}
                  </NativeSelectOptGroup>
                </NativeSelect>
                <FieldError errors={errors.responsavel ? [errors.responsavel] : undefined} />
              </Field>
              <CampoTexto
                id="tarefa-prazo"
                rotulo="Prazo"
                type="date"
                erro={errors.prazo}
                {...form.register("prazo")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <CampoSelecao
                id="tarefa-parte"
                rotulo="Parte responsável"
                opcoes={opcoesDe(LABEL_PARTE)}
                erro={errors.parteResponsavel}
                {...form.register("parteResponsavel")}
              />
              <CampoSelecao
                id="tarefa-prioridade"
                rotulo="Prioridade"
                opcoes={opcoesDe(LABEL_PRIORIDADE)}
                {...form.register("prioridade")}
              />
              <CampoSelecao
                id="tarefa-status"
                rotulo="Status"
                opcoes={opcoesDe(LABEL_STATUS_TAREFA)}
                {...form.register("status")}
              />
            </div>
            {status === "BLOQUEADA" ? (
              <CampoTextoLongo
                id="tarefa-motivo"
                rotulo="Motivo do bloqueio"
                rows={3}
                descricao="Obrigatório para tarefa bloqueada (mínimo 10 caracteres)."
                erro={errors.motivoBloqueio}
                {...form.register("motivoBloqueio")}
              />
            ) : null}
          </FieldGroup>
          <DialogFooter className="sm:justify-between">
            {tarefa ? (
              <ConfirmarAcao
                gatilho={
                  <Button type="button" variant="ghost">
                    <Trash2 aria-hidden />
                    Excluir
                  </Button>
                }
                titulo="Excluir tarefa?"
                descricao={`"${tarefa.titulo}" será excluída. A exclusão fica registrada no histórico.`}
                rotuloConfirmar="Excluir"
                sucesso="Tarefa excluída."
                aoConfirmar={async () => {
                  const r = await excluirTarefa({ projetoId, tarefaId: tarefa.id });
                  if (r.ok) setAberto(false);
                  return r;
                }}
              />
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pendente}>
                {pendente ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
