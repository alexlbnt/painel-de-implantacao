import type { Metadata } from "next";
import Link from "next/link";
import { BadgeStatusReuniao } from "@/components/badge-status";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Cartao } from "@/components/cartao";
import { EstadoVazio } from "@/components/estado-vazio";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GestaoImpedimentos } from "@/features/impedimentos/components/gestao-impedimentos";
import { obterProjeto } from "@/features/projetos/queries";
import { DialogoNovaReuniao } from "@/features/reunioes/components/dialogo-nova-reuniao";
import { listarImpedimentos, listarReunioes } from "@/features/reunioes/queries";
import { formatarData, hojeISO, LABEL_TIPO_REUNIAO } from "@/lib/formatos";
import { proximaDataReuniao, proximoNumero } from "@/lib/regras/reunioes";
import { exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Reuniões" };

export default async function PaginaReunioes({ params }: PageProps<"/projetos/[id]/reunioes">) {
  const { id } = await params;
  await exigirMembro(id);
  const projeto = await obterProjeto(id);
  const [reunioes, impedimentos] = await Promise.all([listarReunioes(id), listarImpedimentos(id)]);

  const nova = (
    <DialogoNovaReuniao
      projetoId={id}
      diaReuniao={projeto.diaReuniao}
      dataSugerida={proximaDataReuniao(hojeISO(), projeto.diaReuniao)}
      proximoNumero={proximoNumero(reunioes.map((r) => r.numero))}
    />
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Reuniões"
        descricao="Reunião semanal de governança com ata estruturada. Cada ata abre com as ações da anterior."
        acoes={reunioes.length > 0 ? nova : undefined}
      />

      {reunioes.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma reunião registrada"
          descricao="Registre a primeira reunião. A numeração é sequencial e a data já vem no dia configurado."
          acao={nova}
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nº</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reunioes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold">{r.numero}</TableCell>
                  <TableCell>
                    <Link
                      href={`/projetos/${id}/reunioes/${r.id}`}
                      className="font-medium text-brand-800 underline-offset-4 hover:underline"
                    >
                      {LABEL_TIPO_REUNIAO[r.tipo]}
                      <span className="sr-only"> — abrir ata nº {r.numero}</span>
                    </Link>
                  </TableCell>
                  <TableCell>{formatarData(r.data)}</TableCell>
                  <TableCell>
                    <BadgeStatusReuniao status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Cartao titulo="Impedimentos" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Impedimentos são do projeto: aparecem em toda ata enquanto estiverem abertos.
        </p>
        <GestaoImpedimentos projetoId={id} impedimentos={impedimentos} />
      </Cartao>
    </>
  );
}
