import { z } from "zod";
import { PapelProjeto } from "@/generated/prisma/enums";
import { id } from "@/lib/validacao";

const papel = z.enum(PapelProjeto, { error: "Escolha o papel" });

export const adicionarMembroSchema = z.object({
  projetoId: id,
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  papel,
});
export type AdicionarMembroInput = z.input<typeof adicionarMembroSchema>;

export const mudarPapelSchema = z.object({ projetoId: id, membroId: id, papel });
export const removerMembroSchema = z.object({ projetoId: id, membroId: id });
