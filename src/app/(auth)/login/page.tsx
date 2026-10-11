import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormLogin } from "@/features/auth/components/form-login";
import { obterSessao } from "@/server/permissoes";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin() {
  if (await obterSessao()) redirect("/projetos");
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">Acesse com seu e-mail e senha.</p>
      </div>
      <FormLogin />
    </div>
  );
}
