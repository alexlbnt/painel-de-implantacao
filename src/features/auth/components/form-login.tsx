"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CampoTexto } from "@/components/campo-formulario";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { aplicarErrosDoServidor } from "@/lib/formulario";
import { entrar } from "../actions";
import { loginSchema, type LoginInput } from "../schemas";

export function FormLogin() {
  const [pendente, iniciar] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });
  const { errors } = form.formState;

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await entrar(dados);
      // Em caso de sucesso a action redireciona; aqui só chegam recusas.
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
          autoComplete="current-password"
          erro={errors.senha}
          {...form.register("senha")}
        />
      </FieldGroup>
      <Button type="submit" size="lg" className="w-full" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-brand-800 underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
