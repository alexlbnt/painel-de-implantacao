"use client";

import { Pencil, Trash2, UserPlus } from "lucide-react";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { excluirPessoa } from "../actions";
import { DialogoPessoa, type PessoaEditavel } from "./dialogo-pessoa";

export type PessoaDaLista = PessoaEditavel & { departamento: string | null };

export function TabelaPessoas({
  projetoId,
  pessoas,
  departamentos,
}: {
  projetoId: string;
  pessoas: PessoaDaLista[];
  departamentos: { id: string; nome: string }[];
}) {
  const nova = (
    <DialogoPessoa
      projetoId={projetoId}
      departamentos={departamentos}
      gatilho={
        <Button>
          <UserPlus aria-hidden />
          Nova pessoa
        </Button>
      }
    />
  );

  if (pessoas.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma pessoa do cliente cadastrada"
        descricao="Cadastre secretários, gestores e servidores que participam da implantação."
        acao={nova}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{nova}</div>
      <div className="rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pessoas.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>{p.cargo ?? "—"}</TableCell>
                <TableCell>{p.departamento ?? "—"}</TableCell>
                <TableCell className="text-sm">
                  {p.email || p.telefone ? (
                    <>
                      {p.email ? <div>{p.email}</div> : null}
                      {p.telefone ? (
                        <div className="text-muted-foreground">{p.telefone}</div>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <DialogoPessoa
                      projetoId={projetoId}
                      departamentos={departamentos}
                      pessoa={p}
                      gatilho={
                        <Button variant="ghost" size="icon" aria-label={`Editar ${p.nome}`}>
                          <Pencil aria-hidden />
                        </Button>
                      }
                    />
                    <ConfirmarAcao
                      gatilho={
                        <Button variant="ghost" size="icon" aria-label={`Excluir ${p.nome}`}>
                          <Trash2 aria-hidden />
                        </Button>
                      }
                      titulo={`Excluir ${p.nome}?`}
                      descricao="A pessoa sai das listas de presença e de participantes. A exclusão fica no histórico."
                      rotuloConfirmar="Excluir"
                      sucesso="Pessoa excluída."
                      aoConfirmar={() => excluirPessoa({ projetoId, pessoaId: p.id })}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
