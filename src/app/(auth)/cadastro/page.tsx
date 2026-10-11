import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormCadastro } from "@/features/auth/components/form-cadastro";
import { obterSessao } from "@/server/permissoes";

export const metadata: Metadata = { title: "Criar conta" };

export default async function PaginaCadastro() {
  if (await obterSessao()) redirect("/projetos");
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Com a conta criada, você pode abrir implantações ou ser adicionado a uma equipe.
        </p>
      </div>
      <FormCadastro />
    </div>
  );
}
