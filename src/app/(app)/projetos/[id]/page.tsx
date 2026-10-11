import type { Metadata } from "next";
import Link from "next/link";
import { BadgeParte } from "@/components/badge-status";
import { Cartao, CartaoIndicador } from "@/components/cartao";
import { GraficoModulos } from "@/components/grafico-modulos";
import { Progress } from "@/components/ui/progress";
import { CabecalhoProjeto } from "@/features/painel/components/cabecalho-projeto";
import { dadosDoPainel } from "@/features/painel/queries";
import { descreverAbertura } from "@/lib/regras/abertura";
import { formatarData, formatarPercentual, LABEL_FASE, plural } from "@/lib/formatos";
import { exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Painel" };

const link = "text-sm font-medium text-brand-800 underline-offset-4 hover:underline";

export default async function PaginaPainel({ params }: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  await exigirMembro(id);
  const d = await dadosDoPainel(id);

  return (
    <>
      <CabecalhoProjeto projeto={d.projeto} saude={d.saude} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* 1. Progresso (RN10) */}
        <CartaoIndicador
          rotulo="Progresso"
          valor={formatarPercentual(d.percentual)}
          complemento="Média ponderada pelo peso dos módulos"
        >
          <Progress
            value={d.percentual}
            aria-label={`Progresso do projeto: ${d.percentual}%`}
            className="mt-1"
          />
          <Link href={`/projetos/${id}/modulos`} className={`mt-auto pt-2 ${link}`}>
            Ver módulos
          </Link>
        </CartaoIndicador>

        {/* 2. Fase e prazo (RN03) */}
        <CartaoIndicador
          rotulo="Fase e prazo"
          valor={LABEL_FASE[d.projeto.fase]}
          complemento={
            <>
              <p className={d.abertura.noPrazo ? "text-brand-800" : "font-medium text-danger"}>
                {descreverAbertura(d.abertura)}
              </p>
              <p>
                Handoff em {formatarData(d.projeto.handoffEm)} · prazo de abertura{" "}
                {formatarData(d.abertura.prazo)}
              </p>
            </>
          }
        >
          <Link href={`/projetos/${id}/fases`} className={`mt-auto pt-2 ${link}`}>
            Ver ciclo de vida
          </Link>
        </CartaoIndicador>

        {/* 3. Tarefas atrasadas, por parte */}
        <CartaoIndicador
          rotulo="Tarefas atrasadas"
          valor={d.atrasadas.total}
          complemento={
            d.totalTarefas === 0
              ? "Nenhuma tarefa cadastrada"
              : d.atrasadas.total === 0
                ? `Nenhuma em atraso de ${plural(d.totalTarefas, "tarefa")}`
                : "Quem está atrasando:"
          }
        >
          {d.atrasadas.total > 0 ? (
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center justify-between gap-2">
                <BadgeParte parte="CONTRATADA" />
                <span className="font-semibold">{d.atrasadas.contratada}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <BadgeParte parte="CONTRATANTE" />
                <span className="font-semibold">{d.atrasadas.contratante}</span>
              </li>
            </ul>
          ) : null}
          <Link
            href={`/projetos/${id}/tarefas?visao=lista&atrasadas=1`}
            className={`mt-auto pt-2 ${link}`}
          >
            {d.atrasadas.total > 0 ? "Ver tarefas atrasadas" : "Ver tarefas"}
          </Link>
        </CartaoIndicador>
      </div>

      {/* 8. Progresso por módulo */}
      <Cartao titulo="Progresso por módulo" className="mt-4">
        <GraficoModulos
          dados={d.modulos}
          percentualProjeto={d.modulos.length > 0 ? d.percentual : undefined}
        />
      </Cartao>
    </>
  );
}
