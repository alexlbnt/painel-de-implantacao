"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { CampoTexto } from "@/components/campo-formulario";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { Button } from "@/components/ui/button";
import { tratarResultado } from "@/lib/acao-cliente";
import { formatarData } from "@/lib/formatos";
import { adicionarFeriado, excluirFeriado } from "../actions";
import { feriadoSchema, type FeriadoInput } from "../schemas";

type Feriado = { id: string; data: string; nome: string; global: boolean };

export function FeriadosProjeto({
  projetoId,
  feriados,
  podeEditar,
}: {
  projetoId: string;
  feriados: Feriado[];
  podeEditar: boolean;
}) {
  const [pendente, iniciar] = useTransition();
  const form = useForm<FeriadoInput>({
    resolver: zodResolver(feriadoSchema),
    defaultValues: { projetoId, data: "", nome: "" },
  });
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await adicionarFeriado(dados);
      if (tratarResultado(r, { sucesso: "Feriado cadastrado.", setError: form.setError })) {
        form.reset({ projetoId, data: "", nome: "" });
      }
    }),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Os feriados nacionais já são considerados automaticamente. Cadastre aqui os feriados
        municipais e pontos facultativos que afetam os prazos em dias úteis.
      </p>
      {podeEditar ? (
        <form
          onSubmit={enviar}
          noValidate
          className="grid gap-3 sm:grid-cols-[11rem_1fr_auto] sm:items-start"
        >
          <CampoTexto
            id="feriado-data"
            rotulo="Data"
            type="date"
            erro={form.formState.errors.data}
            {...form.register("data")}
          />
          <CampoTexto
            id="feriado-nome"
            rotulo="Nome"
            placeholder="Ex.: Aniversário do município"
            erro={form.formState.errors.nome}
            {...form.register("nome")}
          />
          <Button type="submit" disabled={pendente} className="sm:mt-7">
            <Plus aria-hidden />
            Adicionar
          </Button>
        </form>
      ) : null}
      {feriados.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted-foreground">
          Nenhum feriado municipal cadastrado.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {feriados.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <span>
                <span className="font-medium">{formatarData(f.data)}</span> · {f.nome}
                {f.global ? (
                  <span className="text-muted-foreground"> (todos os projetos)</span>
                ) : null}
              </span>
              {podeEditar && !f.global ? (
                <ConfirmarAcao
                  gatilho={
                    <Button variant="ghost" size="icon" aria-label={`Excluir feriado ${f.nome}`}>
                      <Trash2 aria-hidden />
                    </Button>
                  }
                  titulo="Excluir feriado?"
                  descricao={`${formatarData(f.data)} · ${f.nome} deixa de contar nos prazos deste projeto.`}
                  rotuloConfirmar="Excluir"
                  sucesso="Feriado excluído."
                  aoConfirmar={() => excluirFeriado({ projetoId, feriadoId: f.id })}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
