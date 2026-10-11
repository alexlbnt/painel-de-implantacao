import "server-only";
import { z } from "zod";

// Valida variáveis de servidor na primeira leitura.
// SKIP_ENV_VALIDATION=1 permite build/CI sem banco real (seção 16).
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL não configurada"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET não configurado"),
});

type Env = z.infer<typeof schema>;

let cache: Env | undefined;

export function env(): Env {
  if (cache) return cache;
  if (process.env.SKIP_ENV_VALIDATION) {
    cache = {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "",
    };
    return cache;
  }
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const faltando = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Configuração de ambiente inválida: ${faltando}. Veja o .env.example.`);
  }
  cache = parsed.data;
  return cache;
}
