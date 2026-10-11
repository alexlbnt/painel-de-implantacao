import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Card padrão (seção 12): surface, borda line, raio 0.75rem, no máximo shadow-sm.
export function Cartao({
  titulo,
  acao,
  children,
  className,
  id,
}: {
  titulo?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm",
        className,
      )}
      aria-labelledby={id && titulo ? `${id}-titulo` : undefined}
    >
      {titulo || acao ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {titulo ? (
            <h2 id={id ? `${id}-titulo` : undefined} className="text-lg font-semibold">
              {titulo}
            </h2>
          ) : (
            <span />
          )}
          {acao}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Indicador do painel: rótulo, número grande e complemento. */
export function CartaoIndicador({
  rotulo,
  valor,
  complemento,
  children,
  href,
}: {
  rotulo: string;
  valor: ReactNode;
  complemento?: ReactNode;
  children?: ReactNode;
  href?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
      <p className="text-3xl font-semibold tracking-tight">{valor}</p>
      {complemento ? <div className="text-sm text-muted-foreground">{complemento}</div> : null}
      {children}
      {href ? <span className="sr-only">Abrir detalhes</span> : null}
    </div>
  );
}
