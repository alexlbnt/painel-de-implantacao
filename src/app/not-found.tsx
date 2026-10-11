import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-brand-800">Erro 404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço não existe ou você não tem acesso a ele.</p>
      <Button asChild>
        <Link href="/projetos">Ir para meus projetos</Link>
      </Button>
    </main>
  );
}
