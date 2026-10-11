"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Plus } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { BadgeImpedimento, BadgeParte } from "@/components/badge-status";
import { CampoSelecao, CampoTextoLongo, opcoesDe } from "@/components/campo-formulario";
import { EstadoVazio } from "@/components/estado-vazio";
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
import type { CategoriaImpedimento, Parte, StatusImpedimento } from "@/generated/prisma/enums";
import { tratarResultado } from "@/lib/acao-cliente";
import { formatarData, LABEL_CATEGORIA_IMPEDIMENTO, LABEL_PARTE } from "@/lib/formatos";
import { abrirImpedimento, resolverImpedimento } from "../actions";
import {
  abrirImpedimentoSchema,
  resolverImpedimentoSchema,
  type AbrirImpedimentoInput,
  type ResolverImpedimentoInput,
} from "../schemas";

export type ImpedimentoVisivel = {
  id: string;
  categoria: CategoriaImpedimento;
  descricao: string;
  parteResponsavel: Parte;
  status: StatusImpedimento;
  abertoEm: string;
  resolvidoEm?: string | null;
  resolucao: string | null;
  reuniaoNumero?: number | null;
};

function DialogoAbrir({
  projetoId,
  reuniaoId,
  gatilho,
}: {
  projetoId: string;
  reuniaoId?: string;
  gatilho: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const inicial: AbrirImpedimentoInput = {
    projetoId,
    reuniaoId: reuniaoId ?? null,
    categoria: "OUTRO",
    descricao: "",
    parteResponsavel: "CONTRATANTE",
  };
  const form = useForm<AbrirImpedimentoInput>({
    resolver: zodResolver(abrirImpedimentoSchema),
    defaultValues: inicial,
  });
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      if (
        tratarResultado(await abrirImpedimento(dados), {
          sucesso: "Impedimento registrado.",
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
        if (v) form.reset(inicial);
      }}
    >
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Novo impedimento</DialogTitle>
            <DialogDescription>
              Algo que trava a implantação hoje. Riscos (o que pode acontecer) ficam em outro
              registro.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelecao
                id="imp-categoria"
                rotulo="Categoria"
                opcoes={opcoesDe(LABEL_CATEGORIA_IMPEDIMENTO)}
                {...form.register("categoria")}
              />
              <CampoSelecao
                id="imp-parte"
                rotulo="Parte responsável"
                opcoes={opcoesDe(LABEL_PARTE)}
                {...form.register("parteResponsavel")}
              />
            </div>
            <CampoTextoLongo
              id="imp-descricao"
              rotulo="Descrição"
              rows={3}
              erro={form.formState.errors.descricao}
              {...form.register("descricao")}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando…" : "Registrar impedimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogoResolver({ projetoId, imp }: { projetoId: string; imp: ImpedimentoVisivel }) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const form = useForm<ResolverImpedimentoInput>({
    resolver: zodResolver(resolverImpedimentoSchema),
    defaultValues: { projetoId, impedimentoId: imp.id, resolucao: "" },
  });
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      if (
        tratarResultado(await resolverImpedimento(dados), {
          sucesso: "Impedimento resolvido.",
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
        if (v) form.reset({ projetoId, impedimentoId: imp.id, resolucao: "" });
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <CircleCheck aria-hidden />
          Resolver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Resolver impedimento</DialogTitle>
            <DialogDescription>{imp.descricao}</DialogDescription>
          </DialogHeader>
          <CampoTextoLongo
            id={`resolucao-${imp.id}`}
            rotulo="Como foi resolvido"
            rows={3}
            erro={form.formState.errors.resolucao}
            {...form.register("resolucao")}
          />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando…" : "Marcar como resolvido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Lista de impedimentos com abrir/resolver (RF11). */
export function GestaoImpedimentos({
  projetoId,
  reuniaoId,
  impedimentos,
  podeEditar = true,
}: {
  projetoId: string;
  reuniaoId?: string;
  impedimentos: ImpedimentoVisivel[];
  podeEditar?: boolean;
}) {
  const novo = podeEditar ? (
    <DialogoAbrir
      projetoId={projetoId}
      reuniaoId={reuniaoId}
      gatilho={
        <Button variant="secondary">
          <Plus aria-hidden />
          Novo impedimento
        </Button>
      }
    />
  ) : null;

  if (impedimentos.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum impedimento aberto"
        descricao="Ótimo sinal. Registre aqui o que travar a implantação."
        acao={novo}
      />
    );
  }
  return (
    <div className="space-y-3">
      {novo ? <div className="flex justify-end">{novo}</div> : null}
      <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
        {impedimentos.map((i) => (
          <li
            key={i.id}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1.5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <BadgeImpedimento status={i.status} />
                <span className="font-medium">{LABEL_CATEGORIA_IMPEDIMENTO[i.categoria]}</span>
                <BadgeParte parte={i.parteResponsavel} />
              </div>
              <p className="break-words">{i.descricao}</p>
              <p className="text-xs text-muted-foreground">
                Aberto em {formatarData(i.abertoEm)}
                {i.reuniaoNumero ? ` · reunião nº ${i.reuniaoNumero}` : ""}
                {i.resolvidoEm ? ` · resolvido em ${formatarData(i.resolvidoEm)}` : ""}
              </p>
              {i.resolucao ? (
                <p className="rounded-md bg-brand-50 px-3 py-2 text-brand-900">
                  <span className="font-medium">Resolução: </span>
                  {i.resolucao}
                </p>
              ) : null}
            </div>
            {podeEditar && i.status === "ABERTO" ? (
              <DialogoResolver projetoId={projetoId} imp={i} />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
