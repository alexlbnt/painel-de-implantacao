import type { Metadata } from "next";
import Link from "next/link";
import { KanbanSquare, List, Plus } from "lucide-react";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { DialogoTarefa } from "@/features/tarefas/components/dialogo-tarefa";
import { FiltrosLista, TabelaTarefas } from "@/features/tarefas/components/lista-tarefas";
import { QuadroTarefas } from "@/features/tarefas/components/quadro-tarefas";
import { listarTarefas, opcoesTarefa } from "@/features/tarefas/queries";
import { hojeISO } from "@/lib/formatos";
import { filtrarTarefas, type FiltrosTarefa } from "@/lib/regras/tarefas";
import { cn } from "@/lib/utils";
import { exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Tarefas" };

function texto(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

export default async function PaginaTarefas({
  params,
  searchParams,
}: PageProps<"/projetos/[id]/tarefas">) {
  const { id } = await params;
  await exigirMembro(id);
  const sp = await searchParams;
  const visao = sp.visao === "lista" ? "lista" : "quadro";
  const parte = texto(sp.parte);
  const filtros: FiltrosTarefa = {
    moduloId: texto(sp.modulo),
    departamentoId: texto(sp.departamento),
    responsavel: texto(sp.responsavel),
    parte: parte === "CONTRATADA" || parte === "CONTRATANTE" ? parte : undefined,
    atrasadas: sp.atrasadas === "1",
  };

  const [tarefas, opcoes] = await Promise.all([listarTarefas(id), opcoesTarefa(id)]);
  const hoje = hojeISO();

  const nova = (
    <DialogoTarefa
      projetoId={id}
      opcoes={opcoes}
      gatilho={
        <Button>
          <Plus aria-hidden />
          Nova tarefa
        </Button>
      }
    />
  );
  const abaClasse = (ativa: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
      ativa ? "bg-surface text-ink shadow-sm" : "text-muted-foreground hover:text-ink",
    );

  return (
    <>
      <CabecalhoPagina
        titulo="Tarefas"
        descricao="Por módulo e departamento, com responsável, prazo e parte responsável."
        acoes={tarefas.length > 0 ? nova : undefined}
      />

      {tarefas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma tarefa cadastrada"
          descricao="Crie a primeira tarefa para acompanhar quem faz o quê e até quando."
          acao={nova}
        />
      ) : (
        <>
          <nav
            aria-label="Modo de visualização"
            className="mb-4 inline-flex rounded-lg bg-muted p-1"
          >
            <Link
              href={`/projetos/${id}/tarefas`}
              aria-current={visao === "quadro" ? "page" : undefined}
              className={abaClasse(visao === "quadro")}
            >
              <KanbanSquare className="size-4" aria-hidden />
              Quadro
            </Link>
            <Link
              href={`/projetos/${id}/tarefas?visao=lista`}
              aria-current={visao === "lista" ? "page" : undefined}
              className={abaClasse(visao === "lista")}
            >
              <List className="size-4" aria-hidden />
              Lista
            </Link>
          </nav>

          {visao === "quadro" ? (
            <QuadroTarefas
              key={tarefas
                .map((t) => `${t.id}:${t.status}:${t.ordem}:${t.prazo}:${t.titulo}`)
                .join("|")}
              projetoId={id}
              tarefas={tarefas}
              opcoes={opcoes}
              hoje={hoje}
            />
          ) : (
            <>
              <FiltrosLista projetoId={id} opcoes={opcoes} filtros={filtros} />
              {(() => {
                const filtradas = filtrarTarefas(tarefas, filtros, hoje);
                return filtradas.length === 0 ? (
                  <EstadoVazio
                    titulo="Nenhuma tarefa com esses filtros"
                    descricao="Ajuste os filtros ou limpe a busca."
                  />
                ) : (
                  <>
                    <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
                      {filtradas.length} de {tarefas.length} tarefas
                    </p>
                    <TabelaTarefas projetoId={id} tarefas={filtradas} opcoes={opcoes} hoje={hoje} />
                  </>
                );
              })()}
            </>
          )}
        </>
      )}
    </>
  );
}
