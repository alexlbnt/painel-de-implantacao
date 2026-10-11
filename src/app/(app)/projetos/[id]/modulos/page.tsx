import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Cartao } from "@/components/cartao";
import { GraficoModulos } from "@/components/grafico-modulos";
import { LinhaModulo } from "@/features/modulos/components/linha-modulo";
import { formatarPercentual } from "@/lib/formatos";
import { calcularPercentualProjeto } from "@/lib/regras/progresso";
import { prisma } from "@/server/db";
import { exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Módulos" };

export default async function PaginaModulos({ params }: PageProps<"/projetos/[id]/modulos">) {
  const { id } = await params;
  await exigirMembro(id);
  const modulos = await prisma.modulo.findMany({
    where: { projetoId: id },
    orderBy: [{ peso: "desc" }, { nome: "asc" }],
  });
  const percentual = calcularPercentualProjeto(modulos);

  return (
    <>
      <CabecalhoPagina
        titulo="Módulos"
        descricao="Módulos implantados, com status, percentual, aderência e peso. O percentual do projeto é a média ponderada pelo peso."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Cartao>
          <p className="text-sm font-medium text-muted-foreground">Percentual do projeto</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">
            {formatarPercentual(percentual)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Σ(percentual × peso) ÷ Σ(peso), calculado — nunca digitado.
          </p>
        </Cartao>
        <Cartao titulo="Progresso por módulo">
          <GraficoModulos
            dados={modulos.map((m) => ({ nome: m.nome, percentual: m.percentual }))}
            percentualProjeto={modulos.length > 0 ? percentual : undefined}
          />
        </Cartao>
      </div>

      <Cartao titulo="Novo módulo" className="mb-6">
        <LinhaModulo projetoId={id} />
      </Cartao>

      {modulos.length > 0 ? (
        <section aria-labelledby="lista-modulos">
          <h2 id="lista-modulos" className="mb-3 text-lg font-semibold">
            Módulos cadastrados ({modulos.length})
          </h2>
          <ul className="space-y-3">
            {modulos.map((m) => (
              <li
                key={m.id}
                className="rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-sm"
              >
                <LinhaModulo
                  key={`${m.id}-${m.atualizadoEm.getTime()}`}
                  projetoId={id}
                  modulo={{
                    id: m.id,
                    nome: m.nome,
                    status: m.status,
                    percentual: m.percentual,
                    aderencia: m.aderencia,
                    peso: m.peso,
                    observacao: m.observacao,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-6 text-center text-sm text-muted-foreground">
          Nenhum módulo cadastrado. Cadastre o primeiro acima — sem módulos o projeto não passa para
          o Check-out.
        </p>
      )}
    </>
  );
}
