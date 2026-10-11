import { formatarDataHora, LABEL_ACAO_HISTORICO, LABEL_ENTIDADE } from "@/lib/formatos";
import { formatarValorHistorico, nomeDoCampo } from "../formatar";
import type { EntradaHistorico } from "../queries";

// Lista cronológica do histórico (mais recentes primeiro). Reutilizada no detalhe de wiki e evidências.
export function ListaHistorico({
  entradas,
  mostrarEntidade = true,
}: {
  entradas: EntradaHistorico[];
  mostrarEntidade?: boolean;
}) {
  return (
    <ol className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
      {entradas.map((e) => {
        const campo = nomeDoCampo(e.campo);
        return (
          <li key={e.id} className="space-y-1 p-4 text-sm">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium">{e.autor.nome}</span>
              <span className="text-muted-foreground">
                {LABEL_ACAO_HISTORICO[e.acao].toLowerCase()}
              </span>
              {mostrarEntidade ? (
                <span className="font-medium">{LABEL_ENTIDADE[e.entidade] ?? e.entidade}</span>
              ) : null}
              {campo ? <span className="text-muted-foreground">· {campo}</span> : null}
              <time
                className="ml-auto text-xs text-muted-foreground"
                dateTime={e.criadoEm.toISOString()}
              >
                {formatarDataHora(e.criadoEm)}
              </time>
            </p>
            {e.acao === "ATUALIZAR" ? (
              <p className="break-words">
                <span className="text-muted-foreground line-through decoration-muted-foreground/60">
                  {formatarValorHistorico(e.valorAnterior)}
                </span>
                <span aria-hidden className="mx-2 text-muted-foreground">
                  →
                </span>
                <span className="sr-only"> para </span>
                <span className="font-medium">{formatarValorHistorico(e.valorNovo)}</span>
              </p>
            ) : (
              <p className="break-words">
                {formatarValorHistorico(e.acao === "EXCLUIR" ? e.valorAnterior : e.valorNovo)}
              </p>
            )}
            {e.motivo ? (
              <p className="rounded-md bg-muted px-3 py-2 text-ink">
                <span className="font-medium">Motivo: </span>
                {e.motivo}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
