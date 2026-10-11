import { BadgeFase, BadgeSaude, BadgeStatusProjeto } from "@/components/badge-status";
import type { FaseProjeto, StatusProjeto } from "@/generated/prisma/enums";
import type { Saude } from "@/lib/regras/saude";

// Cabeçalho do painel (seção 11): nome, cliente, município/UF, fase, saúde e status se não for ATIVO.
export function CabecalhoProjeto({
  projeto,
  saude,
}: {
  projeto: {
    nome: string;
    cliente: string;
    municipio: string;
    uf: string;
    fase: FaseProjeto;
    status: StatusProjeto;
  };
  saude: Saude;
}) {
  return (
    <div className="mb-6 space-y-3 border-b border-line pb-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{projeto.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {projeto.cliente} · {projeto.municipio}/{projeto.uf}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Fase</span>
        <BadgeFase fase={projeto.fase} />
        <span className="ml-2 text-muted-foreground">Saúde</span>
        <BadgeSaude saude={saude} />
        {projeto.status !== "ATIVO" ? (
          <>
            <span className="ml-2 text-muted-foreground">Status</span>
            <BadgeStatusProjeto status={projeto.status} />
          </>
        ) : null}
      </div>
    </div>
  );
}
