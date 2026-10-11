import type { Metadata } from "next";
import { FormCadastro } from "@/features/auth/components/form-cadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCadastro() {
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
