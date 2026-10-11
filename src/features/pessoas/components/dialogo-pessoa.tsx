"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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
import { salvarPessoa } from "../actions";
import { pessoaSchema, type PessoaInput } from "../schemas";

export type PessoaEditavel = {
  id: string;
  nome: string;
  cargo: string | null;
  departamentoId: string | null;
  email: string | null;
  telefone: string | null;
};

export function DialogoPessoa({
  projetoId,
  departamentos,
  pessoa,
  gatilho,
}: {
  projetoId: string;
  departamentos: { id: string; nome: string }[];
  pessoa?: PessoaEditavel;
  gatilho: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const valoresIniciais: PessoaInput = {
    projetoId,
    pessoaId: pessoa?.id,
    nome: pessoa?.nome ?? "",
    cargo: pessoa?.cargo ?? "",
    departamentoId: pessoa?.departamentoId ?? "",
    email: pessoa?.email ?? "",
    telefone: pessoa?.telefone ?? "",
  };
  const form = useForm<PessoaInput, unknown, z.output<typeof pessoaSchema>>({
    resolver: zodResolver(pessoaSchema),
    defaultValues: valoresIniciais,
  });
  const { errors } = form.formState;

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await salvarPessoa(dados);
      if (
        tratarResultado(r, {
          sucesso: pessoa ? "Pessoa atualizada." : "Pessoa cadastrada.",
          setError: form.setError,
        })
      ) {
        setAberto(false);
        if (!pessoa) form.reset(valoresIniciais);
      }
    }),
  );

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v) form.reset(valoresIniciais);
      }}
    >
      <DialogTrigger asChild>{gatilho}</DialogTrigger>
      <DialogContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {pessoa ? "Editar pessoa do cliente" : "Nova pessoa do cliente"}
            </DialogTitle>
            <DialogDescription>
              Servidores e contatos do cliente envolvidos na implantação.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <CampoTexto
              id="pessoa-nome"
              rotulo="Nome"
              erro={errors.nome}
              {...form.register("nome")}
            />
            <CampoTexto
              id="pessoa-cargo"
              rotulo="Cargo (opcional)"
              erro={errors.cargo}
              {...form.register("cargo")}
            />
            <CampoSelecao
              id="pessoa-departamento"
              rotulo="Departamento"
              vazio="Sem departamento"
              opcoes={departamentos.map((d) => ({ valor: d.id, rotulo: d.nome }))}
              erro={errors.departamentoId}
              {...form.register("departamentoId")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTexto
                id="pessoa-email"
                rotulo="E-mail (opcional)"
                type="email"
                erro={errors.email}
                {...form.register("email")}
              />
              <CampoTexto
                id="pessoa-telefone"
                rotulo="Telefone (opcional)"
                type="tel"
                erro={errors.telefone}
                {...form.register("telefone")}
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
