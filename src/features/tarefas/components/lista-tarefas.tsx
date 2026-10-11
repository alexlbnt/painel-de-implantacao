import Link from "next/link";
import { BadgeParte, BadgeStatusTarefa } from "@/components/badge-status";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarData, LABEL_PARTE } from "@/lib/formatos";
import { tarefaAtrasada } from "@/lib/regras/saude";
import type { FiltrosTarefa } from "@/lib/regras/tarefas";
import { cn } from "@/lib/utils";
import type { OpcoesTarefa, TarefaDaLista } from "../queries";
import { DialogoTarefa } from "./dialogo-tarefa";

function Filtro({
  id,
  rotulo,
  children,
}: {
  id: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      {children}
    </div>
  );
}

/** Filtros da lista (GET, funcionam sem JavaScript). */
export function FiltrosLista({
  projetoId,
  opcoes,
  filtros,
}: {
  projetoId: string;
  opcoes: OpcoesTarefa;
  filtros: FiltrosTarefa;
}) {
  const ativos = Object.values(filtros).some(Boolean);
  return (
    <form
      method="get"
      className="mb-4 grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <input type="hidden" name="visao" value="lista" />
      <Filtro id="f-modulo" rotulo="Módulo">
        <NativeSelect id="f-modulo" name="modulo" defaultValue={filtros.moduloId ?? ""}>
          <NativeSelectOption value="">Todos</NativeSelectOption>
          {opcoes.modulos.map((o) => (
            <NativeSelectOption key={o.valor} value={o.valor}>
              {o.rotulo}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Filtro>
      <Filtro id="f-departamento" rotulo="Departamento">
        <NativeSelect
          id="f-departamento"
          name="departamento"
          defaultValue={filtros.departamentoId ?? ""}
        >
          <NativeSelectOption value="">Todos</NativeSelectOption>
          {opcoes.departamentos.map((o) => (
            <NativeSelectOption key={o.valor} value={o.valor}>
              {o.rotulo}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Filtro>
      <Filtro id="f-responsavel" rotulo="Responsável">
        <NativeSelect
          id="f-responsavel"
          name="responsavel"
          defaultValue={filtros.responsavel ?? ""}
        >
          <NativeSelectOption value="">Todos</NativeSelectOption>
          <NativeSelectOptGroup label="Equipe (contratada)">
            {opcoes.responsaveis.equipe.map((o) => (
              <NativeSelectOption key={o.valor} value={o.valor}>
                {o.rotulo}
              </NativeSelectOption>
            ))}
          </NativeSelectOptGroup>
          <NativeSelectOptGroup label="Cliente (contratante)">
            {opcoes.responsaveis.cliente.map((o) => (
              <NativeSelectOption key={o.valor} value={o.valor}>
                {o.rotulo}
              </NativeSelectOption>
            ))}
          </NativeSelectOptGroup>
        </NativeSelect>
      </Filtro>
      <Filtro id="f-parte" rotulo="Parte">
        <NativeSelect id="f-parte" name="parte" defaultValue={filtros.parte ?? ""}>
          <NativeSelectOption value="">Ambas</NativeSelectOption>
          {Object.entries(LABEL_PARTE).map(([valor, rotulo]) => (
            <NativeSelectOption key={valor} value={valor}>
              {rotulo}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Filtro>
      <label className="flex h-9 items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="atrasadas"
          value="1"
          defaultChecked={filtros.atrasadas}
          className="size-4 accent-[#708226]"
        />
        Só atrasadas
      </label>
      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        {ativos ? (
          <Button asChild variant="secondary">
            <Link href={`/projetos/${projetoId}/tarefas?visao=lista`}>Limpar</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function TabelaTarefas({
  projetoId,
  tarefas,
  opcoes,
  hoje,
}: {
  projetoId: string;
  tarefas: TarefaDaLista[];
  opcoes: OpcoesTarefa;
  hoje: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarefa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Parte</TableHead>
            <TableHead>Módulo / departamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tarefas.map((t) => {
            const atrasada = tarefaAtrasada(t, hoje);
            return (
              <TableRow key={t.id}>
                <TableCell className="max-w-72 whitespace-normal">
                  <DialogoTarefa
                    projetoId={projetoId}
                    opcoes={opcoes}
                    tarefa={t}
                    gatilho={
                      <button
                        type="button"
                        className="text-left font-medium text-ink hover:text-brand-800 hover:underline"
                      >
                        {t.titulo}
                      </button>
                    }
                  />
                  {t.status === "BLOQUEADA" && t.motivoBloqueio ? (
                    <p className="mt-1 text-xs text-[#991B1B]">Motivo: {t.motivoBloqueio}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <BadgeStatusTarefa status={t.status} />
                </TableCell>
                <TableCell>{t.responsavelNome ?? "—"}</TableCell>
                <TableCell className={cn(atrasada && "font-semibold text-danger")}>
                  {formatarData(t.prazo)}
                  {atrasada ? <span className="block text-xs font-normal">atrasada</span> : null}
                </TableCell>
                <TableCell>
                  <BadgeParte parte={t.parteResponsavel} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {[t.modulo, t.departamento].filter(Boolean).join(" · ") || "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
