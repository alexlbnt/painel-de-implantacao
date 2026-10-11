import type { Metadata } from "next";
import Link from "next/link";
import { CartaoIndicador } from "@/components/cartao";
import { CabecalhoProjeto } from "@/features/painel/components/cabecalho-projeto";
import { aberturaDoProjeto, indicadoresDoProjeto, obterProjeto } from "@/features/projetos/queries";
import { descreverAbertura } from "@/lib/regras/abertura";
import { formatarData, LABEL_FASE } from "@/lib/formatos";
import { prisma } from "@/server/db";
import { exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Painel" };

export default async function PaginaPainel({ params }: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  await exigirMembro(id);
  const projeto = await obterProjeto(id);
  const indicadores = await indicadoresDoProjeto(prisma, id);
  const abertura = aberturaDoProjeto(projeto, indicadores.feriados);

  return (
    <>
      <CabecalhoProjeto projeto={projeto} saude={indicadores.saude} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <CartaoIndicador
          rotulo="Fase e prazo"
          valor={LABEL_FASE[projeto.fase]}
          complemento={
            <>
              <p className={abertura.noPrazo ? "text-brand-800" : "font-medium text-danger"}>
                {descreverAbertura(abertura)}
              </p>
              <p>
                Handoff em {formatarData(projeto.handoffEm)} · prazo de abertura{" "}
                {formatarData(abertura.prazo)}
              </p>
            </>
          }
        >
          <Link
            href={`/projetos/${id}/fases`}
            className="mt-auto text-sm font-medium text-brand-800 underline-offset-4 hover:underline"
          >
            Ver ciclo de vida
          </Link>
        </CartaoIndicador>
      </div>
    </>
  );
}
