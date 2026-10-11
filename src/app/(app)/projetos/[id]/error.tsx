"use client";

import { Button } from "@/components/ui/button";

export default function ErroApp({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Não foi possível carregar esta página</h1>
      <p className="text-muted-foreground">
        Algo deu errado do nosso lado. Tente de novo; se o problema continuar, avise o Líder do
        projeto.
      </p>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
