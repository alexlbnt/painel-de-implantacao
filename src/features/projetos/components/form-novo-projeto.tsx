"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";
import { CampoSelecao, CampoTexto } from "@/components/campo-formulario";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { tratarResultado } from "@/lib/acao-cliente";
import { UFS } from "@/lib/formatos";
import { criarProjeto } from "../actions";
import { criarProjetoSchema, type CriarProjetoInput } from "../schemas";

const DEPARTAMENTOS_SUGERIDOS = ["Recursos Humanos", "Contabilidade", "Compras"];

export function FormNovoProjeto({ hoje }: { hoje: string }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const form = useForm<CriarProjetoInput, unknown, z.output<typeof criarProjetoSchema>>({
    resolver: zodResolver(criarProjetoSchema),
    defaultValues: {
      nome: "",
      cliente: "",
      municipio: "",
      uf: "" as CriarProjetoInput["uf"],
      handoffEm: hoje,
      inicioPrevisto: "",
      fimPrevisto: "",
      departamentos: DEPARTAMENTOS_SUGERIDOS.map((nome) => ({ nome })),
    },
  });
  const departamentos = useFieldArray({ control: form.control, name: "departamentos" });
  const { errors } = form.formState;

  const enviar = form.handleSubmit((dados) =>
    iniciar(async () => {
      const r = await criarProjeto(dados);
      if (
        tratarResultado(r, {
          sucesso: "Implantação aberta. Você é o Líder deste projeto.",
          setError: form.setError,
        })
      ) {
        router.push(`/projetos/${r.data.id}`);
      }
    }),
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-8">
      <FieldSet>
        <FieldLegend>Dados do projeto</FieldLegend>
        <FieldGroup>
          <CampoTexto
            id="nome"
            rotulo="Nome do projeto"
            placeholder="Implantação — Município Exemplo"
            erro={errors.nome}
            {...form.register("nome")}
          />
          <CampoTexto
            id="cliente"
            rotulo="Cliente"
            placeholder="Prefeitura, câmara ou autarquia"
            erro={errors.cliente}
            {...form.register("cliente")}
          />
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <CampoTexto
              id="municipio"
              rotulo="Município"
              erro={errors.municipio}
              {...form.register("municipio")}
            />
            <CampoSelecao
              id="uf"
              rotulo="UF"
              vazio="Escolha"
              opcoes={UFS.map((uf) => ({ valor: uf, rotulo: uf }))}
              erro={errors.uf}
              {...form.register("uf")}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Datas</FieldLegend>
        <FieldGroup>
          <CampoTexto
            id="handoffEm"
            rotulo="Data do handoff comercial"
            type="date"
            descricao="O projeto deve ser aberto em até 2 dias úteis após o handoff."
            erro={errors.handoffEm}
            {...form.register("handoffEm")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              id="inicioPrevisto"
              rotulo="Início previsto (opcional)"
              type="date"
              erro={errors.inicioPrevisto}
              {...form.register("inicioPrevisto")}
            />
            <CampoTexto
              id="fimPrevisto"
              rotulo="Fim previsto (opcional)"
              type="date"
              erro={errors.fimPrevisto}
              {...form.register("fimPrevisto")}
            />
          </div>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Departamentos iniciais</FieldLegend>
        <p className="text-sm text-muted-foreground">
          Você pode ajustar depois em Pessoas do cliente. Linhas vazias são ignoradas.
        </p>
        <ul className="space-y-2">
          {departamentos.fields.map((campo, i) => (
            <li key={campo.id} className="flex items-center gap-2">
              <label htmlFor={`departamento-${i}`} className="sr-only">
                Departamento {i + 1}
              </label>
              <Input
                id={`departamento-${i}`}
                placeholder="Nome do departamento"
                {...form.register(`departamentos.${i}.nome`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover departamento ${i + 1}`}
                onClick={() => departamentos.remove(i)}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => departamentos.append({ nome: "" })}
          >
            <Plus aria-hidden />
            Adicionar departamento
          </Button>
        </div>
      </FieldSet>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-6 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push("/projetos")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Abrindo…" : "Abrir implantação"}
        </Button>
      </div>
    </form>
  );
}
