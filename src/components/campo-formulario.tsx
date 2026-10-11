"use client";

import type { ComponentProps } from "react";
import type { FieldError as ErroRHF } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Campo de texto padrão: todo campo tem <label> (RNF08) e erro associado por aria-describedby.
type Props = ComponentProps<typeof Input> & {
  id: string;
  rotulo: string;
  erro?: ErroRHF;
  descricao?: string;
};

export function CampoTexto({ id, rotulo, erro, descricao, ...props }: Props) {
  const idErro = `${id}-erro`;
  const idDescricao = `${id}-descricao`;
  const descritoPor = [descricao ? idDescricao : null, erro ? idErro : null]
    .filter(Boolean)
    .join(" ");
  return (
    <Field data-invalid={!!erro}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <Input id={id} aria-invalid={!!erro} aria-describedby={descritoPor || undefined} {...props} />
      {descricao ? <FieldDescription id={idDescricao}>{descricao}</FieldDescription> : null}
      <FieldError id={idErro} errors={erro ? [erro] : undefined} />
    </Field>
  );
}
