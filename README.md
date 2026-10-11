# Marco — Painel de Implantação de Sistemas

> Projeto pessoal de estudo. Todos os dados são fictícios.

Painel web para conduzir implantações de sistemas, do handoff comercial ao suporte regular.
O README completo de portfólio chega na Sprint 7 (seção 20 da `ESPECIFICACAO.md`).

## Stack (versões fixadas)

| Camada       | Versão                                              |
| ------------ | --------------------------------------------------- |
| Next.js      | 16.4.0 (App Router, Turbopack)                      |
| React        | 19.3.0                                              |
| TypeScript   | 6.0.3                                               |
| Auth.js      | next-auth 5.0.0-beta.32 (Credentials + JWT)         |
| Prisma       | 7.10.0 + @prisma/adapter-neon 7.10.0                |
| Banco        | PostgreSQL na Neon (@neondatabase/serverless 1.2.0) |
| Tailwind CSS | 4.3.3                                               |
| shadcn/ui    | CLI 4.21.4 (Radix)                                  |
| Zod          | 4.6.5                                               |
| Testes       | Vitest 5.0.3                                        |

## Como rodar localmente

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL, DATABASE_URL_UNPOOLED e AUTH_SECRET
npm run db:deploy         # aplica as migrações na Neon
npm run db:seed           # usuários de demonstração
npm run dev
```

Contas de demonstração (senha `Demo@2026`, apenas para o seed):
`lider@exemplo.com`, `analista@exemplo.com`, `visitante@exemplo.com`.

## Qualidade

```bash
npm run lint && npm run typecheck && npm test && npm run build
```
