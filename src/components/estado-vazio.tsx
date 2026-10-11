import type { ReactNode } from "react";

// Estado vazio padrão (seção 11): frase útil + ação opcional.
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="text-base font-semibold">{titulo}</p>
      {descricao ? <p className="max-w-md text-sm text-muted-foreground">{descricao}</p> : null}
      {acao}
    </div>
  );
}
