import type { Metadata } from "next";
import Link from "next/link";
import { Check, CircleDashed } from "lucide-react";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Cartao } from "@/components/cartao";
import { AcoesFase } from "@/features/fases/components/acoes-fase";
import { abaDisponivel } from "@/features/projetos/navegacao";
import { dadosDoPortao, obterProjeto } from "@/features/projetos/queries";
import { formatarData, LABEL_FASE } from "@/lib/formatos";
import {
  avaliarRetrocesso,
  DIAS_CORRIDOS_TRANSICAO,
  diasRestantesTransicao,
  FASES,
  itensDoPortao,
  proximaFase,
} from "@/lib/regras/fases";
import { cn } from "@/lib/utils";
import { prisma } from "@/server/db";
import { ehLider, exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Ciclo de vida" };

export default async function PaginaFases({ params }: PageProps<"/projetos/[id]/fases">) {
  const { id } = await params;
  const { membro } = await exigirMembro(id);
  const projeto = await obterProjeto(id);
  const portao = await dadosDoPortao(prisma, id);

  const indiceAtual = FASES.indexOf(projeto.fase);
  const proxima = proximaFase(projeto.fase);
  const retrocesso = avaliarRetrocesso(projeto.fase);
  const itens = itensDoPortao(projeto.fase, portao);
  const liberado = itens.every((i) => i.atendido);
  const lider = ehLider(membro);

  return (
    <>
      <CabecalhoPagina
        titulo="Ciclo de vida"
        descricao="Fases fixas da implantação. Cada avanço passa por um portão validado no servidor."
      />

      <Cartao titulo="Linha do tempo" className="mb-6">
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {FASES.map((fase, i) => {
            const status = i < indiceAtual ? "concluida" : i === indiceAtual ? "atual" : "futura";
            return (
              <li
                key={fase}
                aria-current={status === "atual" ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  status === "atual" &&
                    "border-brand-600 bg-brand-500 font-semibold text-brand-950",
                  status === "concluida" && "border-brand-200 bg-brand-50 text-brand-900",
                  status === "futura" && "border-line bg-surface text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    status === "atual" && "bg-brand-950 text-brand-50",
                    status === "concluida" && "bg-brand-200 text-brand-900",
                    status === "futura" && "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {status === "concluida" ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span>
                  {LABEL_FASE[fase]}
                  <span className="sr-only">
                    {status === "atual"
                      ? " (fase atual)"
                      : status === "concluida"
                        ? " (concluída)"
                        : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
        {projeto.dataProntidao ? (
          <p className="mt-4 text-sm text-muted-foreground">
            D+0 (prontidão):{" "}
            <span className="font-medium text-ink">{formatarData(projeto.dataProntidao)}</span>
            {projeto.fase === "TRANSICAO" && portao.dataProntidao
              ? ` · transição de ${DIAS_CORRIDOS_TRANSICAO} dias corridos: faltam ${diasRestantesTransicao(portao.dataProntidao, portao.hoje)}`
              : null}
          </p>
        ) : null}
      </Cartao>

      <Cartao
        titulo={
          proxima ? `O que falta para avançar para ${LABEL_FASE[proxima]}` : "Projeto encerrado"
        }
      >
        {proxima ? (
          <ul className="space-y-2">
            {itens.map((item) => (
              <li
                key={item.chave}
                className="flex items-start gap-3 rounded-lg border border-line p-3"
              >
                {item.atendido ? (
                  <Check className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
                ) : (
                  <CircleDashed
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className={cn(item.atendido ? "text-ink" : "font-medium text-ink")}>
                    {item.descricao}
                    <span className="sr-only">{item.atendido ? " — atendido" : " — pendente"}</span>
                  </p>
                  {!item.atendido && item.aba !== "fases" && abaDisponivel(item.aba) ? (
                    <Link
                      href={`/projetos/${id}/${item.aba}`}
                      className="font-medium text-brand-800 underline-offset-4 hover:underline"
                    >
                      Resolver
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            O projeto está encerrado e não muda mais de fase.
          </p>
        )}

        {lider && (proxima || retrocesso.ok) ? (
          <div className="mt-6 border-t border-line pt-4">
            <AcoesFase
              projetoId={id}
              proxima={proxima}
              anterior={retrocesso.ok ? retrocesso.destino : null}
              portaoLiberado={liberado}
            />
            {proxima && !liberado ? (
              <p className="mt-2 text-sm text-muted-foreground">
                O botão de avanço é liberado quando todos os itens acima estiverem atendidos.
              </p>
            ) : null}
          </div>
        ) : null}
        {!lider ? (
          <p className="mt-6 border-t border-line pt-4 text-sm text-muted-foreground">
            Apenas o Líder do projeto avança ou retrocede fases.
          </p>
        ) : null}
      </Cartao>
    </>
  );
}
