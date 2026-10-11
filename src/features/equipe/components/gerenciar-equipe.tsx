"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, UserPlus } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { BadgePapel } from "@/components/badge-status";
import { CampoSelecao, CampoTexto, opcoesDe } from "@/components/campo-formulario";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { PapelProjeto } from "@/generated/prisma/enums";
import { tratarResultado } from "@/lib/acao-cliente";
import { LABEL_PAPEL } from "@/lib/formatos";
import { adicionarMembro, mudarPapel, removerMembro } from "../actions";
import { adicionarMembroSchema, type AdicionarMembroInput } from "../schemas";

export type MembroDaLista = {
  id: string;
  papel: PapelProjeto;
  nome: string;
  email: string;
  ehVoce: boolean;
};

function FormAdicionar({ projetoId }: { projetoId: string }) {
  const [pendente, iniciar] = useTransition();
  const form = useForm<AdicionarMembroInput>({
    resolver: zodResolver(adicionarMembroSchema),
    defaultValues: { projetoId, email: "", papel: "ANALISTA" },
  });
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await adicionarMembro(dados);
      if (tratarResultado(r, { sucesso: "Membro adicionado à equipe.", setError: form.setError })) {
        form.reset({ projetoId, email: "", papel: "ANALISTA" });
      }
    }),
  );
  return (
    <form
      onSubmit={enviar}
      noValidate
      className="grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-start"
    >
      <CampoTexto
        id="email-membro"
        rotulo="E-mail de um usuário cadastrado"
        type="email"
        autoComplete="off"
        erro={form.formState.errors.email}
        {...form.register("email")}
      />
      <CampoSelecao
        id="papel-membro"
        rotulo="Papel"
        opcoes={opcoesDe(LABEL_PAPEL)}
        {...form.register("papel")}
      />
      <Button type="submit" disabled={pendente} className="sm:mt-7">
        <UserPlus aria-hidden />
        {pendente ? "Adicionando…" : "Adicionar"}
      </Button>
    </form>
  );
}

function SeletorPapel({ projetoId, membro }: { projetoId: string; membro: MembroDaLista }) {
  const [pendente, iniciar] = useTransition();
  return (
    <>
      <label htmlFor={`papel-${membro.id}`} className="sr-only">
        Papel de {membro.nome}
      </label>
      <NativeSelect
        id={`papel-${membro.id}`}
        size="sm"
        className="w-36"
        value={membro.papel}
        disabled={pendente}
        onChange={(e) => {
          const papel = e.target.value as PapelProjeto;
          iniciar(async () => {
            tratarResultado(await mudarPapel({ projetoId, membroId: membro.id, papel }), {
              sucesso: `${membro.nome} agora é ${LABEL_PAPEL[papel]}.`,
            });
          });
        }}
      >
        {Object.entries(LABEL_PAPEL).map(([valor, rotulo]) => (
          <NativeSelectOption key={valor} value={valor}>
            {rotulo}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </>
  );
}

export function GerenciarEquipe({
  projetoId,
  membros,
  podeGerenciar,
}: {
  projetoId: string;
  membros: MembroDaLista[];
  podeGerenciar: boolean;
}) {
  return (
    <div className="space-y-6">
      {podeGerenciar ? (
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Adicionar membro</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            A pessoa precisa ter conta no sistema. Se não tiver, peça para ela criar a conta e tente
            de novo.
          </p>
          <FormAdicionar projetoId={projetoId} />
        </div>
      ) : null}

      <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
        {membros.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {m.nome}
                {m.ehVoce ? (
                  <span className="font-normal text-muted-foreground"> (você)</span>
                ) : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {podeGerenciar ? (
                <SeletorPapel projetoId={projetoId} membro={m} />
              ) : (
                <BadgePapel papel={m.papel} />
              )}
              {podeGerenciar ? (
                <ConfirmarAcao
                  gatilho={
                    <Button variant="ghost" size="icon" aria-label={`Remover ${m.nome} da equipe`}>
                      <Trash2 aria-hidden />
                    </Button>
                  }
                  titulo={`Remover ${m.nome}?`}
                  descricao="A pessoa perde o acesso a este projeto. As tarefas atribuídas a ela ficam sem responsável."
                  rotuloConfirmar="Remover"
                  sucesso="Membro removido da equipe."
                  aoConfirmar={() => removerMembro({ projetoId, membroId: m.id })}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
