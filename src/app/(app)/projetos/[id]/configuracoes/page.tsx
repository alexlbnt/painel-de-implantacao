import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Cartao } from "@/components/cartao";
import { AlterarStatus } from "@/features/projetos/components/alterar-status";
import { ExcluirProjeto } from "@/features/projetos/components/excluir-projeto";
import { FeriadosProjeto } from "@/features/projetos/components/feriados-projeto";
import { FormDadosProjeto } from "@/features/projetos/components/form-dados-projeto";
import { obterProjeto } from "@/features/projetos/queries";
import { dataParaISO } from "@/lib/datas";
import { UFS } from "@/lib/formatos";
import { prisma } from "@/server/db";
import { ehLider, exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Configurações" };

export default async function PaginaConfiguracoes({
  params,
}: PageProps<"/projetos/[id]/configuracoes">) {
  const { id } = await params;
  const { membro } = await exigirMembro(id);
  const projeto = await obterProjeto(id);
  const feriados = await prisma.feriado.findMany({
    where: { OR: [{ projetoId: id }, { projetoId: null }] },
    orderBy: { data: "asc" },
  });
  const lider = ehLider(membro);
  const uf = (UFS as readonly string[]).includes(projeto.uf)
    ? (projeto.uf as (typeof UFS)[number])
    : "SP";

  return (
    <>
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Dados do projeto, reunião semanal, status e feriados."
      />
      <div className="space-y-6">
        <Cartao titulo="Dados do projeto">
          <FormDadosProjeto
            podeEditar={lider}
            valores={{
              projetoId: id,
              nome: projeto.nome,
              cliente: projeto.cliente,
              municipio: projeto.municipio,
              uf,
              handoffEm: dataParaISO(projeto.handoffEm),
              inicioPrevisto: projeto.inicioPrevisto ? dataParaISO(projeto.inicioPrevisto) : "",
              fimPrevisto: projeto.fimPrevisto ? dataParaISO(projeto.fimPrevisto) : "",
              diaReuniao: String(projeto.diaReuniao),
            }}
          />
        </Cartao>

        <Cartao titulo="Status">
          <AlterarStatus projetoId={id} status={projeto.status} podeEditar={lider} />
        </Cartao>

        <Cartao titulo="Feriados municipais">
          <FeriadosProjeto
            projetoId={id}
            podeEditar={lider}
            feriados={feriados.map((f) => ({
              id: f.id,
              data: dataParaISO(f.data),
              nome: f.nome,
              global: f.projetoId === null,
            }))}
          />
        </Cartao>

        {lider ? (
          <Cartao titulo="Excluir projeto" className="border-danger/40">
            {projeto.fase === "PLANEJAMENTO" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Disponível enquanto o projeto está em Planejamento. Apaga todos os dados do
                  projeto.
                </p>
                <ExcluirProjeto projetoId={id} nome={projeto.nome} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Só é possível excluir um projeto que ainda está em Planejamento.
              </p>
            )}
          </Cartao>
        ) : null}
      </div>
    </>
  );
}
