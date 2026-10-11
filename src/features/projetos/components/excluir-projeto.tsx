"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { tratarResultado } from "@/lib/acao-cliente";
import { excluirProjeto } from "../actions";

// Excluir projeto: só em PLANEJAMENTO, confirmando com o nome (seção 3). O servidor revalida.
export function ExcluirProjeto({ projetoId, nome }: { projetoId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [pendente, iniciar] = useTransition();
  const confere = confirmacao.trim() === nome.trim();

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        setConfirmacao("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive">Excluir projeto</Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await excluirProjeto({ projetoId, confirmacao });
              // Em caso de sucesso a action redireciona para /projetos.
              if (r) tratarResultado(r);
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Excluir projeto</DialogTitle>
            <DialogDescription>
              Esta ação apaga o projeto e todos os seus dados, inclusive o histórico. Não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="confirmar-nome" className="text-sm font-medium">
              Digite <span className="font-semibold">{nome}</span> para confirmar
            </label>
            <Input
              id="confirmar-nome"
              autoComplete="off"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={!confere || pendente}>
              {pendente ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
