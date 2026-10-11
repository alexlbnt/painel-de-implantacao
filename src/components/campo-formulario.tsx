"use client";

import type { ComponentProps, ReactNode } from "react";
import type { FieldError as ErroRHF } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

// Campos padrão: todo campo tem <label> (RNF08) e erro associado por aria-describedby.

type Comum = {
  id: string;
  rotulo: string;
  erro?: ErroRHF;
  descricao?: ReactNode;
};

function descritoPor(id: string, descricao: unknown, erro: unknown) {
  return (
    [descricao ? `${id}-descricao` : null, erro ? `${id}-erro` : null].filter(Boolean).join(" ") ||
    undefined
  );
}

function Moldura({ id, rotulo, erro, descricao, children }: Comum & { children: ReactNode }) {
  return (
    <Field data-invalid={!!erro}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      {children}
      {descricao ? <FieldDescription id={`${id}-descricao`}>{descricao}</FieldDescription> : null}
      <FieldError id={`${id}-erro`} errors={erro ? [erro] : undefined} />
    </Field>
  );
}

export function CampoTexto({
  id,
  rotulo,
  erro,
  descricao,
  ...props
}: Comum & ComponentProps<typeof Input>) {
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} descricao={descricao}>
      <Input
        id={id}
        aria-invalid={!!erro}
        aria-describedby={descritoPor(id, descricao, erro)}
        {...props}
      />
    </Moldura>
  );
}

export function CampoTextoLongo({
  id,
  rotulo,
  erro,
  descricao,
  ...props
}: Comum & ComponentProps<typeof Textarea>) {
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} descricao={descricao}>
      <Textarea
        id={id}
        aria-invalid={!!erro}
        aria-describedby={descritoPor(id, descricao, erro)}
        {...props}
      />
    </Moldura>
  );
}

export type Opcao = { valor: string; rotulo: string };

export function CampoSelecao({
  id,
  rotulo,
  erro,
  descricao,
  opcoes,
  vazio,
  ...props
}: Comum & Omit<ComponentProps<"select">, "size"> & { opcoes: readonly Opcao[]; vazio?: string }) {
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} descricao={descricao}>
      <NativeSelect
        id={id}
        aria-invalid={!!erro}
        aria-describedby={descritoPor(id, descricao, erro)}
        {...props}
      >
        {vazio !== undefined ? <NativeSelectOption value="">{vazio}</NativeSelectOption> : null}
        {opcoes.map((o) => (
          <NativeSelectOption key={o.valor} value={o.valor}>
            {o.rotulo}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Moldura>
  );
}

/** Converte um Record de labels em opções de seleção, mantendo a ordem das chaves. */
export function opcoesDe<T extends string>(labels: Record<T, string>): Opcao[] {
  return (Object.keys(labels) as T[]).map((valor) => ({ valor, rotulo: labels[valor] }));
}
