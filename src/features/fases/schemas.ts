import { z } from "zod";
import { id, motivo } from "@/lib/validacao";

export const mudarFaseSchema = z.object({
  projetoId: id,
  motivo,
});
export type MudarFaseInput = z.input<typeof mudarFaseSchema>;
