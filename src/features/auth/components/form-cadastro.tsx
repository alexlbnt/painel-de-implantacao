"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CampoTexto } from "@/components/campo-formulario";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { SENHA_MIN } from "@/lib/constantes";
import { aplicarErrosDoServidor } from "@/lib/formulario";
import { cadastrar } from "../actions";
import { cadastroSchema, type CadastroInput } from "../schemas";

export function FormCadastro() {
  const [pendente, iniciar] = useTransition();
  const form = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nome: "", email: "", senha: "", confirmacao: "" },
  });
  const { errors } = form.formState;

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await cadastrar(dados);
      // Em caso de sucesso a action entra na conta e redireciona.
      if (r && !r.ok) {
        aplicarErrosDoServidor(form.setError, r.campos);
        toast.error(r.erro);
      }
    }),
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <FieldGroup>
        <CampoTexto
          id="nome"
          rotulo="Nome"
          autoComplete="name"
          erro={errors.nome}
          {...form.register("nome")}
        />
        <CampoTexto
          id="email"
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          erro={errors.email}
          {...form.register("email")}
        />
        <CampoTexto
          id="senha"
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          descricao={`Mínimo de ${SENHA_MIN} caracteres.`}
          erro={errors.senha}
          {...form.register("senha")}
        />
        <CampoTexto
          id="confirmacao"
          rotulo="Confirme a senha"
          type="password"
          autoComplete="new-password"
          erro={errors.confirmacao}
          {...form.register("confirmacao")}
        />
      </FieldGroup>
      <Button type="submit" size="lg" className="w-full" disabled={pendente}>
        {pendente ? "Criando conta…" : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-800 underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
