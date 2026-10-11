"use client";

import "./globals.css";

export default function ErroGlobal({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-ink">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Algo deu errado</h1>
          <p className="text-muted-foreground">
            Não foi possível carregar a aplicação. Tente novamente em instantes.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-brand-950 hover:bg-brand-600"
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
