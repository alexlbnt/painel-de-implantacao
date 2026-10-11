"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Save, Trash2, UserMinus } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { BadgeParte, BadgeStatusTarefa } from "@/components/badge-status";
import { CampoSelecao, CampoTexto, CampoTextoLongo, opcoesDe } from "@/components/campo-formulario";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Parte, StatusTarefa } from "@/generated/prisma/enums";
import { tratarResultado } from "@/lib/acao-cliente";
import { formatarData, LABEL_PARTE, LABEL_PRIORIDADE } from "@/lib/formatos";
import { rotuloDecisao } from "@/lib/regras/reunioes";
import { criarAcaoReuniao } from "../../tarefas/actions";
import { acaoReuniaoSchema, type AcaoReuniaoInput } from "../../tarefas/schemas";
import {
  adicionarParticipante,
  excluirDecisao,
  removerParticipante,
  salvarDadosReuniao,
  salvarDecisao,
} from "../actions";
import {
  dadosReuniaoSchema,
  participanteSchema,
  type DadosReuniaoInput,
  type ParticipanteInput,
} from "../schemas";

type Opcao = { valor: string; rotulo: string };
type Ids = { projetoId: string; reuniaoId: string };

/** Seção numerada da ata, na ordem do PDF (seção 14). */
export function SecaoAta({
  numero,
  titulo,
  children,
  acao,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`secao-${numero}`}
      className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id={`secao-${numero}`} className="text-lg font-semibold">
          <span className="mr-2 text-brand-800">{numero}.</span>
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

// ---------- 1. Cabeçalho ----------
export function FormCabecalho({
  ids,
  valores,
}: {
  ids: Ids;
  valores: { data: string; horaInicio: string; horaFim: string; local: string };
}) {
  const [pendente, iniciar] = useTransition();
  const form = useForm<DadosReuniaoInput, unknown, z.output<typeof dadosReuniaoSchema>>({
    resolver: zodResolver(dadosReuniaoSchema),
    defaultValues: { ...ids, ...valores },
  });
  const { errors, isDirty } = form.formState;
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      if (
        tratarResultado(await salvarDadosReuniao(dados), {
          sucesso: "Cabeçalho salvo.",
          setError: form.setError,
        })
      ) {
        form.reset(form.getValues());
      }
    }),
  );
  return (
    <form
      onSubmit={enviar}
      noValidate
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[10rem_7rem_7rem_1fr_auto] lg:items-start"
    >
      <CampoTexto
        id="ata-data"
        rotulo="Data"
        type="date"
        erro={errors.data}
        {...form.register("data")}
      />
      <CampoTexto
        id="ata-inicio"
        rotulo="Início"
        type="time"
        erro={errors.horaInicio}
        {...form.register("horaInicio")}
      />
      <CampoTexto
        id="ata-fim"
        rotulo="Término"
        type="time"
        erro={errors.horaFim}
        {...form.register("horaFim")}
      />
      <CampoTexto
        id="ata-local"
        rotulo="Local"
        placeholder="Sala, endereço ou videochamada"
        erro={errors.local}
        {...form.register("local")}
      />
      <Button type="submit" disabled={pendente || !isDirty} className="lg:mt-7">
        <Save aria-hidden />
        Salvar
      </Button>
    </form>
  );
}

// ---------- 2. Participantes ----------
type Participante = { id: string; parte: Parte; nome: string };

export function Participantes({
  ids,
  participantes,
  opcoes,
}: {
  ids: Ids;
  participantes: Participante[];
  opcoes: { equipe: Opcao[]; cliente: Opcao[] };
}) {
  const [pendente, iniciar] = useTransition();
  const inicial: ParticipanteInput = { ...ids, origem: "", nomeAvulso: "", parte: "CONTRATANTE" };
  const form = useForm<ParticipanteInput, unknown, z.output<typeof participanteSchema>>({
    resolver: zodResolver(participanteSchema),
    defaultValues: inicial,
  });
  const origem = useWatch({ control: form.control, name: "origem" });
  const { errors } = form.formState;
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      if (
        tratarResultado(await adicionarParticipante(dados), {
          sucesso: "Participante adicionado.",
          setError: form.setError,
        })
      ) {
        form.reset(inicial);
      }
    }),
  );
  const presentes = new Set(participantes.map((p) => p.nome));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {(["CONTRATADA", "CONTRATANTE"] as const).map((parte) => {
          const lista = participantes.filter((p) => p.parte === parte);
          return (
            <div key={parte}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BadgeParte parte={parte} /> ({lista.length})
              </h3>
              {lista.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line p-3 text-sm text-muted-foreground">
                  Ninguém registrado.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {lista.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm"
                    >
                      <span className="truncate">{p.nome}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover ${p.nome}`}
                        disabled={pendente}
                        onClick={() =>
                          iniciar(async () => {
                            tratarResultado(
                              await removerParticipante({ ...ids, participanteId: p.id }),
                              {
                                sucesso: "Participante removido.",
                              },
                            );
                          })
                        }
                      >
                        <UserMinus aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <form
        onSubmit={enviar}
        noValidate
        className="grid gap-3 border-t border-line pt-4 md:grid-cols-[1fr_1fr_10rem_auto] md:items-start"
      >
        <Field data-invalid={!!errors.origem}>
          <FieldLabel htmlFor="part-origem">Adicionar participante</FieldLabel>
          <NativeSelect id="part-origem" {...form.register("origem")}>
            <NativeSelectOption value="">Escolha…</NativeSelectOption>
            <NativeSelectOptGroup label="Equipe (contratada)">
              {opcoes.equipe.map((o) => (
                <NativeSelectOption
                  key={o.valor}
                  value={o.valor}
                  disabled={presentes.has(o.rotulo)}
                >
                  {o.rotulo}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
            <NativeSelectOptGroup label="Cliente (contratante)">
              {opcoes.cliente.map((o) => (
                <NativeSelectOption key={o.valor} value={o.valor}>
                  {o.rotulo}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
            <NativeSelectOption value="avulso">Outra pessoa (sem cadastro)…</NativeSelectOption>
          </NativeSelect>
          <FieldError errors={errors.origem ? [errors.origem] : undefined} />
        </Field>
        {origem === "avulso" ? (
          <>
            <CampoTexto
              id="part-nome"
              rotulo="Nome"
              erro={errors.nomeAvulso}
              {...form.register("nomeAvulso")}
            />
            <CampoSelecao
              id="part-parte"
              rotulo="Parte"
              opcoes={opcoesDe(LABEL_PARTE)}
              {...form.register("parte")}
            />
          </>
        ) : (
          <div className="hidden md:col-span-2 md:block" />
        )}
        <Button type="submit" disabled={pendente} className="md:mt-7">
          <Plus aria-hidden />
          Adicionar
        </Button>
      </form>
    </div>
  );
}

// ---------- 3 e 8. Textos livres (resumo e salvaguardas) ----------
export function FormTextoAta({
  ids,
  campo,
  rotulo,
  valor,
  descricao,
}: {
  ids: Ids;
  campo: "resumoStatus" | "salvaguardas";
  rotulo: string;
  valor: string;
  descricao?: string;
}) {
  const [pendente, iniciar] = useTransition();
  const form = useForm<DadosReuniaoInput, unknown, z.output<typeof dadosReuniaoSchema>>({
    resolver: zodResolver(dadosReuniaoSchema),
    defaultValues: { ...ids, [campo]: valor },
  });
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      if (
        tratarResultado(await salvarDadosReuniao(dados), {
          sucesso: `${rotulo} salvo.`,
          setError: form.setError,
        })
      ) {
        form.reset(form.getValues());
      }
    }),
  );
  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <CampoTextoLongo
        id={`ata-${campo}`}
        rotulo={rotulo}
        rows={5}
        descricao={descricao}
        erro={form.formState.errors[campo]}
        {...form.register(campo)}
      />
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pendente || !form.formState.isDirty}>
          <Save aria-hidden />
          Salvar
        </Button>
      </div>
    </form>
  );
}

// ---------- 4. Ações da reunião anterior (somente leitura, status atual) ----------
type AcaoLista = {
  id: string;
  titulo: string;
  responsavel: string | null;
  prazo: string | null;
  status: StatusTarefa;
};

export function AcoesAnteriores({ numero, itens }: { numero: number | null; itens: AcaoLista[] }) {
  if (numero === null)
    return <p className="text-sm text-muted-foreground">Esta é a primeira reunião do projeto.</p>;
  if (itens.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">A reunião nº {numero} não registrou ações.</p>
    );
  }
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Ações da reunião nº {numero}, com o status de hoje (carregadas automaticamente).
      </p>
      <TabelaAcoes itens={itens} />
    </div>
  );
}

function TabelaAcoes({
  itens,
  mostrarParte,
}: {
  itens: (AcaoLista & { parteResponsavel?: Parte })[];
  mostrarParte?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Ação
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Responsável
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Prazo
            </th>
            {mostrarParte ? (
              <th scope="col" className="px-3 py-2 font-medium">
                Parte
              </th>
            ) : null}
            <th scope="col" className="px-3 py-2 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {itens.map((a) => (
            <tr key={a.id}>
              <td className="px-3 py-2">{a.titulo}</td>
              <td className="px-3 py-2">
                {a.responsavel ?? <span className="text-danger">sem responsável</span>}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {a.prazo ? formatarData(a.prazo) : <span className="text-danger">sem prazo</span>}
              </td>
              {mostrarParte && a.parteResponsavel ? (
                <td className="px-3 py-2">
                  <BadgeParte parte={a.parteResponsavel} />
                </td>
              ) : null}
              <td className="px-3 py-2">
                <BadgeStatusTarefa status={a.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- 6. Decisões numeradas ----------
type Decisao = { id: string; numero: number; texto: string };

function LinhaDecisao({ ids, d }: { ids: Ids; d: Decisao }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(d.texto);
  const [pendente, iniciar] = useTransition();
  return (
    <li className="space-y-2 p-3">
      <p className="text-sm font-semibold text-brand-800">{rotuloDecisao(d.numero)}</p>
      {editando ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              if (
                tratarResultado(await salvarDecisao({ ...ids, decisaoId: d.id, texto }), {
                  sucesso: "Decisão atualizada.",
                })
              ) {
                setEditando(false);
              }
            });
          }}
        >
          <label htmlFor={`dec-${d.id}`} className="sr-only">
            Texto da {rotuloDecisao(d.numero)}
          </label>
          <Textarea
            id={`dec-${d.id}`}
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => (setTexto(d.texto), setEditando(false))}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              Salvar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm break-words whitespace-pre-line">{d.texto}</p>
          <div className="flex shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${rotuloDecisao(d.numero)}`}
              onClick={() => setEditando(true)}
            >
              <Pencil aria-hidden />
            </Button>
            <ConfirmarAcao
              gatilho={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Excluir ${rotuloDecisao(d.numero)}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              }
              titulo={`Excluir ${rotuloDecisao(d.numero)}?`}
              descricao="As decisões seguintes são renumeradas."
              rotuloConfirmar="Excluir"
              sucesso="Decisão excluída."
              aoConfirmar={() => excluirDecisao({ ...ids, decisaoId: d.id })}
            />
          </div>
        </div>
      )}
    </li>
  );
}

export function Decisoes({ ids, decisoes }: { ids: Ids; decisoes: Decisao[] }) {
  const [texto, setTexto] = useState("");
  const [pendente, iniciar] = useTransition();
  return (
    <div className="space-y-4">
      {decisoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma decisão registrada nesta reunião.</p>
      ) : (
        <ol className="divide-y divide-line rounded-lg border border-line">
          {decisoes.map((d) => (
            <LinhaDecisao key={`${d.id}-${d.numero}-${d.texto}`} ids={ids} d={d} />
          ))}
        </ol>
      )}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            if (
              tratarResultado(await salvarDecisao({ ...ids, texto }), {
                sucesso: "Decisão registrada.",
              })
            )
              setTexto("");
          });
        }}
      >
        <label htmlFor="nova-decisao" className="text-sm font-medium">
          Nova decisão ({rotuloDecisao(decisoes.length + 1)})
        </label>
        <Textarea
          id="nova-decisao"
          rows={2}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pendente || texto.trim().length < 3}>
            <Plus aria-hidden />
            Registrar decisão
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------- 7. Plano de ação ----------
function DialogoNovaAcao({
  ids,
  opcoes,
}: {
  ids: Ids;
  opcoes: {
    modulos: Opcao[];
    departamentos: Opcao[];
    responsaveis: { equipe: Opcao[]; cliente: Opcao[] };
  };
}) {
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();
  const inicial: AcaoReuniaoInput = {
    ...ids,
    titulo: "",
    moduloId: "",
    departamentoId: "",
    responsavel: "",
    prazo: "",
    prioridade: "MEDIA",
    parteResponsavel: "CONTRATADA",
  };
  const form = useForm<AcaoReuniaoInput, unknown, z.output<typeof acaoReuniaoSchema>>({
    resolver: zodResolver(acaoReuniaoSchema),
    defaultValues: inicial,
  });
  const { errors } = form.formState;
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      if (
        tratarResultado(await criarAcaoReuniao(dados), {
          sucesso: "Ação adicionada ao plano.",
          setError: form.setError,
        })
      ) {
        setAberto(false);
      }
    }),
  );
  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v) form.reset(inicial);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus aria-hidden />
          Nova ação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nova ação do plano</DialogTitle>
            <DialogDescription>
              Vira uma tarefa do projeto. Toda ação de ata tem responsável e prazo.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <CampoTexto
              id="acao-titulo"
              rotulo="Ação"
              erro={errors.titulo}
              {...form.register("titulo")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.responsavel}>
                <FieldLabel htmlFor="acao-responsavel">Responsável</FieldLabel>
                <NativeSelect
                  id="acao-responsavel"
                  aria-invalid={!!errors.responsavel}
                  {...form.register("responsavel")}
                >
                  <NativeSelectOption value="">Escolha…</NativeSelectOption>
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
                <FieldError errors={errors.responsavel ? [errors.responsavel] : undefined} />
              </Field>
              <CampoTexto
                id="acao-prazo"
                rotulo="Prazo"
                type="date"
                erro={errors.prazo}
                {...form.register("prazo")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelecao
                id="acao-parte"
                rotulo="Parte responsável"
                opcoes={opcoesDe(LABEL_PARTE)}
                {...form.register("parteResponsavel")}
              />
              <CampoSelecao
                id="acao-prioridade"
                rotulo="Prioridade"
                opcoes={opcoesDe(LABEL_PRIORIDADE)}
                {...form.register("prioridade")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelecao
                id="acao-modulo"
                rotulo="Módulo"
                vazio="Sem módulo"
                opcoes={opcoes.modulos}
                {...form.register("moduloId")}
              />
              <CampoSelecao
                id="acao-dep"
                rotulo="Departamento"
                vazio="Sem departamento"
                opcoes={opcoes.departamentos}
                {...form.register("departamentoId")}
              />
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Salvando…" : "Adicionar ação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PlanoAcao({
  ids,
  acoes,
  opcoes,
}: {
  ids: Ids;
  acoes: (AcaoLista & { parteResponsavel: Parte })[];
  opcoes: {
    modulos: Opcao[];
    departamentos: Opcao[];
    responsaveis: { equipe: Opcao[]; cliente: Opcao[] };
  };
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Cada ação vira uma tarefa do projeto e continua editável em Tarefas.
        </p>
        <DialogoNovaAcao ids={ids} opcoes={opcoes} />
      </div>
      {acoes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-3 text-sm text-muted-foreground">
          Nenhuma ação registrada.
        </p>
      ) : (
        <TabelaAcoes itens={acoes} mostrarParte />
      )}
    </div>
  );
}
