"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { CampoTexto } from "@/components/campo-formulario";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tratarResultado } from "@/lib/acao-cliente";
import { plural } from "@/lib/formatos";
import { excluirDepartamento, salvarDepartamento } from "../actions";
import { departamentoSchema, type DepartamentoInput } from "../schemas";

type Departamento = { id: string; nome: string; pessoas: number };

function LinhaDepartamento({ projetoId, dep }: { projetoId: string; dep: Departamento }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(dep.nome);
  const [pendente, iniciar] = useTransition();

  const salvar = () =>
    iniciar(async () => {
      const r = await salvarDepartamento({ projetoId, departamentoId: dep.id, nome });
      if (tratarResultado(r, { sucesso: "Departamento renomeado." })) setEditando(false);
    });

  return (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      {editando ? (
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            salvar();
          }}
        >
          <label htmlFor={`dep-${dep.id}`} className="sr-only">
            Novo nome de {dep.nome}
          </label>
          <Input
            id={`dep-${dep.id}`}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
          <Button type="submit" disabled={pendente}>
            Salvar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setNome(dep.nome);
              setEditando(false);
            }}
          >
            Cancelar
          </Button>
        </form>
      ) : (
        <div className="min-w-0">
          <p className="truncate font-medium">{dep.nome}</p>
          <p className="text-sm text-muted-foreground">{plural(dep.pessoas, "pessoa")}</p>
        </div>
      )}
      {!editando ? (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Renomear ${dep.nome}`}
            onClick={() => setEditando(true)}
          >
            <Pencil aria-hidden />
          </Button>
          <ConfirmarAcao
            gatilho={
              <Button variant="ghost" size="icon" aria-label={`Excluir ${dep.nome}`}>
                <Trash2 aria-hidden />
              </Button>
            }
            titulo={`Excluir ${dep.nome}?`}
            descricao="Pessoas, tarefas e itens de migração deste departamento ficam sem departamento."
            rotuloConfirmar="Excluir"
            sucesso="Departamento excluído."
            aoConfirmar={() => excluirDepartamento({ projetoId, departamentoId: dep.id })}
          />
        </div>
      ) : null}
    </li>
  );
}

export function ListaDepartamentos({
  projetoId,
  departamentos,
}: {
  projetoId: string;
  departamentos: Departamento[];
}) {
  const [pendente, iniciar] = useTransition();
  const form = useForm<DepartamentoInput>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: { projetoId, nome: "" },
  });
  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await salvarDepartamento(dados);
      if (tratarResultado(r, { sucesso: "Departamento adicionado.", setError: form.setError })) {
        form.reset({ projetoId, nome: "" });
      }
    }),
  );

  return (
    <div className="space-y-4">
      <form
        onSubmit={enviar}
        noValidate
        className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start"
      >
        <CampoTexto
          id="novo-departamento"
          rotulo="Novo departamento"
          placeholder="Ex.: Tributação"
          erro={form.formState.errors.nome}
          {...form.register("nome")}
        />
        <Button type="submit" disabled={pendente} className="sm:mt-7">
          <Plus aria-hidden />
          Adicionar
        </Button>
      </form>
      {departamentos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum departamento cadastrado"
          descricao="Cadastre os departamentos do cliente para organizar pessoas, tarefas e migração."
        />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
          {departamentos.map((d) => (
            <LinhaDepartamento key={d.id} projetoId={projetoId} dep={d} />
          ))}
        </ul>
      )}
    </div>
  );
}
