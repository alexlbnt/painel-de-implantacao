"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState, useTransition } from "react";
import type { StatusTarefa } from "@/generated/prisma/enums";
import { tratarResultado } from "@/lib/acao-cliente";
import { LABEL_STATUS_TAREFA } from "@/lib/formatos";
import { STATUS_TAREFA } from "@/lib/regras/tarefas";
import { cn } from "@/lib/utils";
import { moverTarefa } from "../actions";
import type { OpcoesTarefa, TarefaDaLista } from "../queries";
import { CartaoTarefa } from "./cartao-tarefa";
import { DialogoBloqueio } from "./dialogo-bloqueio";
import { DialogoTarefa } from "./dialogo-tarefa";

type Colunas = Record<StatusTarefa, TarefaDaLista[]>;

function agrupar(tarefas: TarefaDaLista[]): Colunas {
  const colunas = { A_FAZER: [], EM_ANDAMENTO: [], BLOQUEADA: [], CONCLUIDA: [] } as Colunas;
  for (const t of tarefas) colunas[t.status].push(t);
  return colunas;
}

const ehStatus = (id: unknown): id is StatusTarefa =>
  typeof id === "string" && (STATUS_TAREFA as readonly string[]).includes(id);

function acharColuna(colunas: Colunas, id: string): StatusTarefa | null {
  if (ehStatus(id)) return id;
  return STATUS_TAREFA.find((s) => colunas[s].some((t) => t.id === id)) ?? null;
}

type Movimento = { tarefa: TarefaDaLista; status: StatusTarefa; posicao: number };

function CartaoArrastavel(props: {
  tarefa: TarefaDaLista;
  hoje: string;
  projetoId: string;
  opcoes: OpcoesTarefa;
  aoMover: (status: StatusTarefa) => void;
}) {
  const { tarefa } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <CartaoTarefa
        tarefa={tarefa}
        hoje={props.hoje}
        arrastando={isDragging}
        aoMover={props.aoMover}
        alca={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Arrastar "${tarefa.titulo}"`}
            className="-ml-1 flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
        editar={
          <DialogoTarefa
            projetoId={props.projetoId}
            opcoes={props.opcoes}
            tarefa={tarefa}
            gatilho={
              <button
                type="button"
                className="w-full rounded text-left font-medium text-ink hover:text-brand-800 hover:underline"
              >
                {tarefa.titulo}
              </button>
            }
          />
        }
      />
    </li>
  );
}

function Coluna({
  status,
  children,
  total,
}: {
  status: StatusTarefa;
  children: React.ReactNode;
  total: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      aria-labelledby={`coluna-${status}`}
      className={cn(
        "flex min-h-40 flex-col rounded-[var(--radius-card)] border border-line bg-muted/60 p-3",
        isOver && "border-brand-500 bg-brand-50",
      )}
    >
      <h2
        id={`coluna-${status}`}
        className="mb-3 flex items-center justify-between text-sm font-semibold"
      >
        {LABEL_STATUS_TAREFA[status]}
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {total}
        </span>
      </h2>
      <ul ref={setNodeRef} className="flex min-h-16 flex-1 flex-col gap-2">
        {children}
      </ul>
    </section>
  );
}

export function QuadroTarefas({
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
  const [colunas, setColunas] = useState<Colunas>(() => agrupar(tarefas));
  const [antesDoArraste, setAntesDoArraste] = useState<Colunas | null>(null);
  const [ativa, setAtiva] = useState<TarefaDaLista | null>(null);
  const [bloqueio, setBloqueio] = useState<Movimento | null>(null);
  const [pendente, iniciar] = useTransition();

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const titulo = (id: string | number) =>
    STATUS_TAREFA.flatMap((s) => colunas[s]).find((t) => t.id === id)?.titulo ?? "tarefa";
  const nomeColuna = (id: string | number) => {
    const c = acharColuna(colunas, String(id));
    return c ? LABEL_STATUS_TAREFA[c] : "";
  };
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Tarefa "${titulo(active.id)}" selecionada.`,
    onDragOver: ({ active, over }) =>
      over ? `Tarefa "${titulo(active.id)}" sobre a coluna ${nomeColuna(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Tarefa "${titulo(active.id)}" solta na coluna ${nomeColuna(over.id)}.`
        : `Tarefa solta.`,
    onDragCancel: ({ active }) => `Movimento da tarefa "${titulo(active.id)}" cancelado.`,
  };

  function persistir(mov: Movimento, motivo?: string, reverterPara?: Colunas | null) {
    iniciar(async () => {
      const r = await moverTarefa({
        projetoId,
        tarefaId: mov.tarefa.id,
        status: mov.status,
        posicao: mov.posicao,
        motivo: motivo ?? null,
      });
      const ok = tratarResultado(r, {
        sucesso:
          mov.status !== mov.tarefa.status
            ? `Tarefa movida para ${LABEL_STATUS_TAREFA[mov.status]}.`
            : undefined,
      });
      if (!ok && reverterPara) setColunas(reverterPara);
    });
  }

  /** Move pelo menu "Mover para" (sem arrastar): vai para o fim da coluna. */
  function moverPeloMenu(tarefa: TarefaDaLista, status: StatusTarefa) {
    const mov = { tarefa, status, posicao: colunas[status].length };
    if (status === "BLOQUEADA") {
      setAntesDoArraste(null);
      setBloqueio(mov);
      return;
    }
    const anterior = colunas;
    setColunas((c) => ({
      ...c,
      [tarefa.status]: c[tarefa.status].filter((t) => t.id !== tarefa.id),
      [status]: [...c[status], { ...tarefa, status }],
    }));
    persistir(mov, undefined, anterior);
  }

  function aoComecar(e: DragStartEvent) {
    setAntesDoArraste(colunas);
    setAtiva(STATUS_TAREFA.flatMap((s) => colunas[s]).find((t) => t.id === e.active.id) ?? null);
  }

  function aoPassar({ active, over }: DragOverEvent) {
    if (!over) return;
    const de = acharColuna(colunas, String(active.id));
    const para = acharColuna(colunas, String(over.id));
    if (!de || !para || de === para) return;
    setColunas((c) => {
      const item = c[de].find((t) => t.id === active.id);
      if (!item) return c;
      const indiceSobre = c[para].findIndex((t) => t.id === over.id);
      const destino = [...c[para]];
      destino.splice(indiceSobre >= 0 ? indiceSobre : destino.length, 0, item);
      return { ...c, [de]: c[de].filter((t) => t.id !== active.id), [para]: destino };
    });
  }

  function aoTerminar({ active, over }: DragEndEvent) {
    setAtiva(null);
    const original = antesDoArraste;
    if (!over || !original) {
      if (original) setColunas(original);
      return;
    }
    const para = acharColuna(colunas, String(over.id));
    const tarefaOriginal = STATUS_TAREFA.flatMap((s) => original[s]).find(
      (t) => t.id === active.id,
    );
    if (!para || !tarefaOriginal) return;

    // Ordem final dentro da coluna de destino.
    const lista = colunas[para];
    const de = lista.findIndex((t) => t.id === active.id);
    const sobre = ehStatus(over.id) ? lista.length - 1 : lista.findIndex((t) => t.id === over.id);
    const final = [...lista];
    if (de >= 0 && sobre >= 0 && de !== sobre) {
      const [item] = final.splice(de, 1);
      final.splice(sobre, 0, item);
    }
    const posicao = Math.max(
      0,
      final.findIndex((t) => t.id === active.id),
    );
    const indiceOriginal = original[tarefaOriginal.status].findIndex((t) => t.id === active.id);
    if (para === tarefaOriginal.status && posicao === indiceOriginal) return;

    setColunas((c) => ({ ...c, [para]: final.map((t) => ({ ...t, status: para })) }));
    const mov = { tarefa: tarefaOriginal, status: para, posicao };
    if (para === "BLOQUEADA" && tarefaOriginal.status !== "BLOQUEADA") {
      setBloqueio(mov);
      return;
    }
    persistir(mov, undefined, original);
  }

  return (
    <>
      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        onDragStart={aoComecar}
        onDragOver={aoPassar}
        onDragEnd={aoTerminar}
        onDragCancel={() => {
          setAtiva(null);
          if (antesDoArraste) setColunas(antesDoArraste);
        }}
        accessibility={{
          announcements: anuncios,
          screenReaderInstructions: {
            draggable:
              "Para mover a tarefa, pressione espaço ou Enter. Use as setas para trocar de posição ou de coluna e pressione espaço ou Enter de novo para soltar. Esc cancela.",
          },
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_TAREFA.map((status) => (
            <Coluna key={status} status={status} total={colunas[status].length}>
              <SortableContext
                items={colunas[status].map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {colunas[status].length === 0 ? (
                  <li className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-muted-foreground">
                    Arraste uma tarefa para cá
                  </li>
                ) : null}
                {colunas[status].map((t) => (
                  <CartaoArrastavel
                    key={t.id}
                    tarefa={t}
                    hoje={hoje}
                    projetoId={projetoId}
                    opcoes={opcoes}
                    aoMover={(s) => moverPeloMenu(t, s)}
                  />
                ))}
              </SortableContext>
            </Coluna>
          ))}
        </div>
        <DragOverlay>
          {ativa ? (
            <div className="rotate-1 rounded-lg border border-brand-500 bg-surface p-3 text-sm font-medium shadow-sm">
              {ativa.titulo}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DialogoBloqueio
        key={bloqueio?.tarefa.id ?? "fechado"}
        aberto={bloqueio !== null}
        titulo={bloqueio?.tarefa.titulo ?? ""}
        pendente={pendente}
        aoCancelar={() => {
          if (antesDoArraste) setColunas(antesDoArraste);
          setBloqueio(null);
        }}
        aoConfirmar={(motivo) => {
          if (!bloqueio) return;
          const mov = bloqueio;
          const reverter = antesDoArraste ?? colunas;
          setColunas((c) => ({
            ...c,
            [mov.tarefa.status]: c[mov.tarefa.status].filter((t) => t.id !== mov.tarefa.id),
            BLOQUEADA: [
              ...c.BLOQUEADA.filter((t) => t.id !== mov.tarefa.id),
              { ...mov.tarefa, status: "BLOQUEADA", motivoBloqueio: motivo },
            ],
          }));
          setBloqueio(null);
          persistir(mov, motivo, reverter);
        }}
      />
    </>
  );
}
