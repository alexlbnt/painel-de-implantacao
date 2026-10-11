# CLAUDE.md — convenções do projeto Marco

@AGENTS.md

**Fonte da verdade do produto:** `ESPECIFICACAO.md`. Não invente requisitos, campos ou regras.
Ambiguidade → decisões provisórias da seção 13 → se faltar, a opção mais simples, registrada em
`docs/DECISOES.md`.

## Regras inegociáveis

- **Sigilo (seção 2):** nada real — empresa, cliente, município, sistema, tela, pessoa. Dados fictícios e
  identificados como tal ("Município Exemplo de Vale Verde"). Nome da contratada vem de
  `NEXT_PUBLIC_ORG_NAME`; nome do app vem de `APP_NAME` (`src/lib/constantes.ts`).
- **Português do Brasil** em interface, mensagens de erro, nomes de domínio e comentários.
- **Permissão sempre no servidor** (Server Action ou Route Handler). Não membro → `notFound()` (404).
- **Toda escrita relevante grava `HistoricoAlteracao` na mesma transação** (`registrarHistorico(tx, …)`).
- **Contraste (seção 12):** nunca texto branco sobre `brand-500`/`brand-600`. Texto sobre o verde =
  `text-brand-950`. Link/destaque = `text-brand-800`. Foco: `ring-2 ring-brand-700 ring-offset-2`.
- **Uma sprint por vez** (seção 17). Não adiantar funcionalidades de sprints futuras.

## Stack (versões fixadas no package.json)

Next.js 16.4 (App Router, Turbopack, `cacheComponents` desligado) · React 19.3 · TypeScript 6.0 (estrito) ·
Auth.js `next-auth@5.0.0-beta.32` (Credentials + JWT) · Prisma 7.10 + `@prisma/adapter-neon` ·
Tailwind CSS 4.3 · shadcn/ui (CLI 4.21, base Radix, pacote `radix-ui`) · Zod 4 · React Hook Form 7 ·
Vitest 5 · ESLint 9 · Prettier 3.

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run lint         # ESLint (zero avisos)
npm run typecheck    # next typegen + tsc --noEmit
npm test             # Vitest (uma vez)
npm run build        # build de produção (CI usa SKIP_ENV_VALIDATION=1)
npm run db:migrate   # prisma migrate dev (usa DATABASE_URL_UNPOOLED)
npm run db:deploy    # prisma migrate deploy
npm run db:seed      # seed de demonstração (idempotente)
npm run db:studio    # Prisma Studio
npx shadcn@4.21.4 add <componente>   # novo componente de UI
```

Fim de sprint: `lint`, `typecheck`, `test`, `build` verdes → commit `sprint N: <resumo>` → relatório → parar.

## Estrutura

```
prisma/schema.prisma        contrato da seção 10 (nomes em português, sem acento)
prisma.config.ts            URL da CLI (DATABASE_URL_UNPOOLED), seed
src/generated/prisma/       client gerado (não versionado; `prisma generate` no postinstall)
src/app/(auth)/             /login, /cadastro (layout dividido)
src/app/(app)/              área autenticada (layout exige sessão)
src/app/api/                Route Handlers (auth, upload, pdf)
src/features/<modulo>/      actions.ts · schemas.ts · queries.ts · components/
src/server/                 db.ts · auth.ts · permissoes.ts · historico.ts · acao.ts · env.ts
src/lib/regras/             regras de negócio PURAS + *.test.ts (sem Prisma, sem Next)
src/lib/formatos.ts         datas dd/MM/yyyy (fuso America/Sao_Paulo), números pt-BR, labels de enums
src/lib/constantes.ts       APP_NAME, ORG_NAME, FUSO_HORARIO
src/components/ui/          shadcn/ui tematizado (pode editar)
src/components/             componentes compartilhados do app
src/pdf/                    templates @react-pdf (Sprint 4+)
```

Imports: `@/…` aponta para `src/`. Client do Prisma: `@/generated/prisma/client` (servidor) e
`@/generated/prisma/enums` (tipos/enums, seguro no cliente).

## Padrão de Server Action

Toda escrita usa os wrappers de `src/server/acao.ts`:

```ts
// src/features/exemplo/actions.ts
"use server";
import { acaoDoProjeto, ErroNegocio } from "@/server/acao";
import { registrarHistorico } from "@/server/historico";
import { algoSchema } from "./schemas"; // z.object({ projetoId: z.string(), ... })

export const fazerAlgo = acaoDoProjeto({
  schema: algoSchema,
  permissao: "lider", // ou "membro"
  async executar({ tx, dados, usuario }) {
    // regras de portão (src/lib/regras) ANTES da escrita; recusa → throw new ErroNegocio("…")
    const registro = await tx.algo.update({ ... });
    await registrarHistorico(tx, {
      projetoId: dados.projetoId, entidade: "Algo", registroId: registro.id,
      acao: "ATUALIZAR", campo: "x", valorAnterior, valorNovo: registro.x, autorId: usuario.id,
    });
    return registro;
  },
  revalidar: (dados) => `/projetos/${dados.projetoId}`,
});
```

Fluxo: `exigirSessao` → `exigirMembro`/`exigirLider` (404 para não membro; Analista recebe
`ErroPermissao`) → `schema.safeParse` (erro → `{ ok: false, erro: "Revise os campos destacados", campos }`)
→ `prisma.$transaction` (escrita + histórico) → `revalidatePath` → `{ ok: true, data }`.
Erros do Prisma nunca chegam crus ao usuário (`traduzirErro`). Atualizações com vários campos:
`registrarAlteracoes(tx, base, anterior, novo, campos)` grava uma linha por campo alterado.
Actions sem projeto (ex.: criar projeto): `acaoAutenticada`.

Páginas e layouts de projeto chamam `await exigirMembro(id)` no servidor. Botões de Líder podem ser
escondidos na UI, mas a checagem real é sempre a da action.

## Formulários

- Schema Zod em `features/<modulo>/schemas.ts`, usado no cliente (`zodResolver`) e na action.
- `CampoTexto` (`src/components/campo-formulario.tsx`) garante `<label>`, `aria-invalid` e erro.
- Resultado da action: `toast.success/erro` (sonner) e `aplicarErrosDoServidor(form.setError, r.campos)`.

## Datas

- Datas sem hora: string `YYYY-MM-DD` na lógica, `@db.Date` no banco, exibidas com `formatarData`.
- "Hoje" nas regras: `hojeISO()` (fuso America/Sao_Paulo).
- Dias úteis: `src/lib/regras/diasUteis.ts` (`ehDiaUtil`, `somarDiasUteis`, `diasUteisEntre`).

## UI

- Todo `page.tsx` tem `loading.tsx` (skeleton) e `error.tsx` (mensagem em português) no segmento.
- Toda lista tem estado vazio com frase útil e ação (`EstadoVazio`).
- Títulos de página com `CabecalhoPagina` (24px semibold). Cards: `bg-card border rounded-[var(--radius-card)]`,
  no máximo `shadow-sm`.
- Badges sempre com texto (labels em `lib/formatos.ts`), cores da tabela da seção 12.
- Mobile a partir de 360px, sem rolagem horizontal da página.

## Testes

- Regras puras: `src/lib/regras/*.test.ts` (obrigatório para cada regra).
- Servidor: mock de `server-only`, `./db`, `./auth` e `next/navigation` (ver `src/server/*.test.ts`).
