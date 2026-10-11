import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, BadgeStatusReuniao } from "@/components/badge-status";
import { GestaoImpedimentos } from "@/features/impedimentos/components/gestao-impedimentos";
import { AtaFinalizada } from "@/features/reunioes/components/ata-finalizada";
import { FinalizarAta } from "@/features/reunioes/components/finalizar-ata";
import {
  AcoesAnteriores,
  Decisoes,
  FormCabecalho,
  FormTextoAta,
  Participantes,
  PlanoAcao,
  SecaoAta,
} from "@/features/reunioes/components/secoes-ata";
import { obterAta, opcoesParticipantes } from "@/features/reunioes/queries";
import { opcoesTarefa } from "@/features/tarefas/queries";
import { dataParaISO } from "@/lib/datas";
import { formatarData, LABEL_TIPO_REUNIAO } from "@/lib/formatos";
import { validarAcoesDaAta } from "@/lib/regras/reunioes";
import { ehLider, exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Ata" };

const TITULO: Record<string, string> = {
  SEMANAL: "Ata de reunião semanal de governança",
  KICKOFF: "Ata de abertura",
  PRONTIDAO: "Ata de prontidão",
};

export default async function PaginaAta({ params }: PageProps<"/projetos/[id]/reunioes/[rid]">) {
  const { id, rid } = await params;
  const { membro } = await exigirMembro(id);
  const ata = await obterAta(id, rid);
  const r = ata.reuniao;
  const ids = { projetoId: id, reuniaoId: rid };

  const cabecalho = (
    <div className="mb-6 space-y-3">
      <Link
        href={`/projetos/${id}/reunioes`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-800 underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Reuniões
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {TITULO[r.tipo]} nº {r.numero}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {formatarData(r.data)} · <Badge tom="neutro">{LABEL_TIPO_REUNIAO[r.tipo]}</Badge>
            <BadgeStatusReuniao status={r.status} />
          </p>
        </div>
        {r.status === "RASCUNHO" && ehLider(membro) ? (
          <FinalizarAta
            projetoId={id}
            reuniaoId={rid}
            pendencias={validarAcoesDaAta(ata.planoAcao)}
          />
        ) : null}
      </div>
    </div>
  );

  if (r.status === "FINALIZADA") {
    return (
      <>
        {cabecalho}
        {ata.snapshot ? (
          <AtaFinalizada s={ata.snapshot} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta ata foi finalizada sem conteúdo congelado.
          </p>
        )}
      </>
    );
  }

  const [opcoesPart, opcoesAcao] = await Promise.all([opcoesParticipantes(id), opcoesTarefa(id)]);

  return (
    <>
      {cabecalho}
      {!ehLider(membro) ? (
        <p className="mb-4 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          Você pode editar o rascunho. Apenas o Líder finaliza a ata.
        </p>
      ) : null}
      <div className="space-y-4">
        <SecaoAta numero={1} titulo="Cabeçalho">
          <FormCabecalho
            ids={ids}
            valores={{
              data: dataParaISO(r.data),
              horaInicio: r.horaInicio ?? "",
              horaFim: r.horaFim ?? "",
              local: r.local ?? "",
            }}
          />
        </SecaoAta>

        <SecaoAta numero={2} titulo="Participantes">
          <Participantes ids={ids} participantes={ata.participantes} opcoes={opcoesPart} />
        </SecaoAta>

        <SecaoAta numero={3} titulo="Status do cronograma">
          <p className="mb-3 text-sm">
            Percentual acumulado hoje:{" "}
            <span className="text-2xl font-semibold">{ata.percentualAtual}%</span>
            <span className="ml-2 text-muted-foreground">(gravado ao finalizar)</span>
          </p>
          <FormTextoAta
            ids={ids}
            campo="resumoStatus"
            rotulo="Resumo executivo"
            valor={r.resumoStatus ?? ""}
          />
        </SecaoAta>

        <SecaoAta numero={4} titulo="Ações da reunião anterior">
          <AcoesAnteriores
            numero={ata.acoesAnteriores.reuniaoNumero}
            itens={ata.acoesAnteriores.itens}
          />
        </SecaoAta>

        <SecaoAta numero={5} titulo="Pontos críticos e impedimentos">
          <GestaoImpedimentos projetoId={id} reuniaoId={rid} impedimentos={ata.impedimentos} />
        </SecaoAta>

        <SecaoAta numero={6} titulo="Decisões e realinhamentos">
          <Decisoes ids={ids} decisoes={ata.decisoes} />
        </SecaoAta>

        <SecaoAta numero={7} titulo="Plano de ação para a próxima semana">
          <PlanoAcao ids={ids} acoes={ata.planoAcao} opcoes={opcoesAcao} />
        </SecaoAta>

        <SecaoAta numero={8} titulo="Observações gerais e salvaguardas">
          <FormTextoAta
            ids={ids}
            campo="salvaguardas"
            rotulo="Observações e salvaguardas"
            valor={r.salvaguardas ?? ""}
          />
        </SecaoAta>
      </div>
    </>
  );
}
