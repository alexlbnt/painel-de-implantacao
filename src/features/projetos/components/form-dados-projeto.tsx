"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { CampoSelecao, CampoTexto } from "@/components/campo-formulario";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { tratarResultado } from "@/lib/acao-cliente";
import { LABEL_DIA_SEMANA, UFS } from "@/lib/formatos";
import { editarProjeto } from "../actions";
import { editarProjetoSchema, type EditarProjetoInput } from "../schemas";

export function FormDadosProjeto({
  valores,
  podeEditar,
}: {
  valores: EditarProjetoInput;
  podeEditar: boolean;
}) {
  const [pendente, iniciar] = useTransition();
  const form = useForm<EditarProjetoInput, unknown, z.output<typeof editarProjetoSchema>>({
    resolver: zodResolver(editarProjetoSchema),
    defaultValues: valores,
  });
  const { errors, isDirty } = form.formState;

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await editarProjeto(dados);
      if (tratarResultado(r, { sucesso: "Dados do projeto salvos.", setError: form.setError })) {
        form.reset(form.getValues());
      }
    }),
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <fieldset disabled={!podeEditar} className="contents">
        <FieldGroup>
          <CampoTexto
            id="cfg-nome"
            rotulo="Nome do projeto"
            erro={errors.nome}
            {...form.register("nome")}
          />
          <CampoTexto
            id="cfg-cliente"
            rotulo="Cliente"
            erro={errors.cliente}
            {...form.register("cliente")}
          />
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <CampoTexto
              id="cfg-municipio"
              rotulo="Município"
              erro={errors.municipio}
              {...form.register("municipio")}
            />
            <CampoSelecao
              id="cfg-uf"
              rotulo="UF"
              opcoes={UFS.map((uf) => ({ valor: uf, rotulo: uf }))}
              erro={errors.uf}
              {...form.register("uf")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoTexto
              id="cfg-handoff"
              rotulo="Handoff comercial"
              type="date"
              erro={errors.handoffEm}
              {...form.register("handoffEm")}
            />
            <CampoTexto
              id="cfg-inicio"
              rotulo="Início previsto"
              type="date"
              erro={errors.inicioPrevisto}
              {...form.register("inicioPrevisto")}
            />
            <CampoTexto
              id="cfg-fim"
              rotulo="Fim previsto"
              type="date"
              erro={errors.fimPrevisto}
              {...form.register("fimPrevisto")}
            />
          </div>
          <CampoSelecao
            id="cfg-dia-reuniao"
            rotulo="Dia da reunião semanal"
            descricao="Usado para sugerir a data da próxima reunião semanal."
            opcoes={Object.entries(LABEL_DIA_SEMANA).map(([valor, rotulo]) => ({ valor, rotulo }))}
            erro={errors.diaReuniao}
            {...form.register("diaReuniao")}
          />
        </FieldGroup>
      </fieldset>
      {podeEditar ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={pendente || !isDirty}>
            {pendente ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Apenas o Líder do projeto edita estes dados.
        </p>
      )}
    </form>
  );
}
