import "dotenv/config";
import { defineConfig } from "prisma/config";

// A CLI (migrate, studio, seed) usa a conexão direta da Neon.
// O app usa a conexão com pooling via adapter (src/server/db.ts).
// `prisma generate` não precisa de banco, por isso a URL pode faltar no CI.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? "",
  },
});
