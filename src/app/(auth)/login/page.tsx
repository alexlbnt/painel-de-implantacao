import type { Metadata } from "next";
import { FormLogin } from "@/features/auth/components/form-login";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
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
