"use client";

import { Button } from "@/components/ui/button";

export default function ErroAuth({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Não foi possível carregar</h1>
      <p className="text-muted-foreground">Tente novamente em instantes.</p>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
