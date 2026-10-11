"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { DialogoMotivo } from "@/components/dialogo-motivo";
import { Button } from "@/components/ui/button";
import type { FaseProjeto } from "@/generated/prisma/enums";
import { LABEL_FASE } from "@/lib/formatos";
import { avancarFase, retrocederFase } from "../actions";

// Botões Avançar/Retroceder (só Líder). O servidor revalida tudo: portão, papel e motivo.
export function AcoesFase({
  projetoId,
  proxima,
  anterior,
  portaoLiberado,
}: {
  projetoId: string;
  proxima: FaseProjeto | null;
  anterior: FaseProjeto | null;
  portaoLiberado: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {anterior ? (
        <DialogoMotivo
          gatilho={
            <Button variant="secondary">
              <ArrowLeft aria-hidden />
              Retroceder para {LABEL_FASE[anterior]}
            </Button>
          }
          titulo={`Retroceder para ${LABEL_FASE[anterior]}`}
          descricao="O projeto volta uma fase. Explique o motivo: ele fica registrado no histórico."
          rotuloConfirmar="Retroceder fase"
          sucesso={`Projeto voltou para ${LABEL_FASE[anterior]}.`}
          aoConfirmar={(motivo) => retrocederFase({ projetoId, motivo })}
        />
      ) : null}
      {proxima ? (
        <DialogoMotivo
          gatilho={
            <Button disabled={!portaoLiberado}>
              Avançar para {LABEL_FASE[proxima]}
              <ArrowRight aria-hidden />
            </Button>
          }
          titulo={`Avançar para ${LABEL_FASE[proxima]}`}
          descricao="Todos os itens do portão estão atendidos. Registre o motivo do avanço."
          rotuloConfirmar="Avançar fase"
          sucesso={`Projeto avançou para ${LABEL_FASE[proxima]}.`}
          aoConfirmar={(motivo) => avancarFase({ projetoId, motivo })}
        />
      ) : null}
    </div>
  );
}
