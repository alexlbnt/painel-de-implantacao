"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { CampoSelecao, CampoTexto, opcoesDe } from "@/components/campo-formulario";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { StatusModulo } from "@/generated/prisma/enums";
import { tratarResultado } from "@/lib/acao-cliente";
import { LABEL_STATUS_MODULO } from "@/lib/formatos";
import { excluirModulo, salvarModulo } from "../actions";
import { moduloSchema, type ModuloInput } from "../schemas";

export type ModuloEditavel = {
  id: string;
  nome: string;
  status: StatusModulo;
  percentual: number;
  aderencia: number | null;
  peso: number;
  observacao: string | null;
};

function paraFormulario(projetoId: string, m?: ModuloEditavel): ModuloInput {
  return {
    projetoId,
    moduloId: m?.id,
    nome: m?.nome ?? "",
    status: m?.status ?? "NAO_INICIADO",
    percentual: m?.percentual ?? 0,
    aderencia: m?.aderencia ?? "",
    peso: m?.peso ?? 1,
    observacao: m?.observacao ?? "",
  };
}

/** Formulário de um módulo (linha editável da tabela ou cadastro de um novo). */
export function LinhaModulo({
  projetoId,
  modulo,
  aoSalvar,
}: {
  projetoId: string;
  modulo?: ModuloEditavel;
  aoSalvar?: () => void;
}) {
  const [pendente, iniciar] = useTransition();
  const prefixo = modulo ? `mod-${modulo.id}` : "mod-novo";
  const form = useForm<ModuloInput, unknown, z.output<typeof moduloSchema>>({
    resolver: zodResolver(moduloSchema),
    defaultValues: paraFormulario(projetoId, modulo),
  });
  const { errors, isDirty } = form.formState;

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await salvarModulo(dados);
      if (
        tratarResultado(r, {
          sucesso: modulo ? "Módulo atualizado." : "Módulo cadastrado.",
          setError: form.setError,
        })
      ) {
        form.reset(modulo ? form.getValues() : paraFormulario(projetoId));
        aoSalvar?.();
      }
    }),
  );

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-label={modulo ? `Módulo ${modulo.nome}` : "Novo módulo"}
      className="grid gap-4 lg:grid-cols-[minmax(10rem,1.4fr)_10rem_minmax(12rem,1.6fr)_6rem_5rem_auto] lg:items-start"
    >
      <CampoTexto
        id={`${prefixo}-nome`}
        rotulo="Módulo"
        erro={errors.nome}
        {...form.register("nome")}
      />
      <CampoSelecao
        id={`${prefixo}-status`}
        rotulo="Status"
        opcoes={opcoesDe(LABEL_STATUS_MODULO)}
        erro={errors.status}
        {...form.register("status")}
      />
      <div className="space-y-2">
        <label htmlFor={`${prefixo}-percentual`} className="text-sm font-medium">
          Percentual
        </label>
        <Controller
          control={form.control}
          name="percentual"
          render={({ field }) => {
            const valor = Number(field.value) || 0;
            return (
              <div className="flex items-center gap-3">
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[valor]}
                  onValueChange={([v]) => field.onChange(v)}
                  rotuloControle={`Percentual de ${modulo?.nome ?? "novo módulo"}`}
                  className="flex-1"
                />
                <Input
                  id={`${prefixo}-percentual`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  className="w-20"
                  aria-invalid={!!errors.percentual}
                  value={field.value as number | string}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              </div>
            );
          }}
        />
        {errors.percentual ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.percentual.message}
          </p>
        ) : null}
      </div>
      <CampoTexto
        id={`${prefixo}-aderencia`}
        rotulo="Aderência %"
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        placeholder="—"
        erro={errors.aderencia}
        {...form.register("aderencia")}
      />
      <CampoTexto
        id={`${prefixo}-peso`}
        rotulo="Peso"
        type="number"
        inputMode="numeric"
        min={1}
        max={10}
        erro={errors.peso}
        {...form.register("peso")}
      />
      <div className="flex gap-1 lg:mt-7">
        <Button
          type="submit"
          disabled={pendente || (modulo && !isDirty)}
          aria-label={modulo ? `Salvar ${modulo.nome}` : undefined}
        >
          <Save aria-hidden />
          {modulo ? <span className="lg:sr-only">Salvar</span> : "Adicionar"}
        </Button>
        {modulo ? (
          <ConfirmarAcao
            gatilho={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Excluir ${modulo.nome}`}
              >
                <Trash2 aria-hidden />
              </Button>
            }
            titulo={`Excluir o módulo ${modulo.nome}?`}
            descricao="Tarefas e treinamentos deste módulo ficam sem módulo. O percentual do projeto é recalculado."
            rotuloConfirmar="Excluir"
            sucesso="Módulo excluído."
            aoConfirmar={() => excluirModulo({ projetoId, moduloId: modulo.id })}
          />
        ) : null}
      </div>
    </form>
  );
}
