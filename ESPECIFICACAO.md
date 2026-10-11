# Marco — Painel de Implantação de Sistemas

Especificação completa para construir o projeto do zero. Este arquivo é a fonte da verdade do produto: o que não estiver aqui não deve ser inventado; o que estiver ambíguo segue a seção 13 (Decisões provisórias) e é registrado em `docs/DECISOES.md`.

> "Marco" é nome de trabalho. Use a constante `APP_NAME` (variável `NEXT_PUBLIC_APP_NAME`) em todo lugar, para trocar o nome sem caçar textos.

---

## Sumário

1. Visão do produto
2. Regras de sigilo
3. Papéis e permissões
4. Ciclo de vida da implantação
5. Requisitos funcionais
6. Regras de negócio
7. Requisitos não funcionais
8. Stack e versões
9. Arquitetura e estrutura de pastas
10. Modelo de dados (schema Prisma)
11. Telas e rotas
12. Design system e paleta
13. Decisões provisórias
14. PDFs
15. Seed de demonstração
16. Testes e CI
17. Plano de entrega por sprints
18. Definição de pronto
19. Fora do escopo
20. README do repositório

---

## 1. Visão do produto

Painel web para conduzir implantações de sistemas em clientes com vários departamentos (prefeituras, câmaras, autarquias), do handoff comercial ao suporte regular. Reúne em um só lugar o ciclo de vida do projeto, módulos implantados, tarefas, reunião semanal com ata, evidências com status de assinatura, treinamentos, wiki do cliente, migração de dados e o checklist de check-out que libera o handover.

**Problema.** Em uma implantação, a informação fica espalhada: cronograma numa planilha, pendências em mensagens, decisões em atas soltas, status da migração na cabeça de quem importou. O líder gasta horas montando status e ata em vez de agir.

**Proposta de valor.** Responder em 10 segundos: em que fase estamos, o que está travado, quem está atrasando (contratada ou contratante) e o que falta para entregar.

**Usuários do MVP.** Líder de implantação e Analista de implantação. O representante do cliente não usa o sistema: ele assina documentos fora dele, e o painel guarda o status.

**Princípio central (RN01).** O painel é a fonte única da verdade. Tudo que é acordo, decisão ou particularidade do cliente precisa estar registrado, com autor e data. Por isso trilha de auditoria e evidências são o coração do produto.

---

## 2. Regras de sigilo

Este é um projeto de portfólio. Ele é inspirado em processos reais de implantação, mas **não pode conter nada real**.

- Nenhum nome de empresa, cliente, município real, sistema, tela, código interno, ferramenta interna ou pessoa real no código, no seed, nos testes, nas capturas ou no README.
- Todos os dados de exemplo são fictícios e assim identificados (ex.: "Município Exemplo de Vale Verde").
- O nome da organização contratada vem de `NEXT_PUBLIC_ORG_NAME` (padrão: `Sua Empresa`).
- Se alguma instrução futura pedir para incluir dado real, pare e pergunte.

---

## 3. Papéis e permissões

Papéis são por projeto (`MembroProjeto.papel`). Um usuário pode ser Líder em um projeto e Analista em outro. Qualquer usuário cadastrado pode criar um projeto e vira seu Líder.

| Ação | Líder | Analista | Não membro |
|---|---|---|---|
| Ver o projeto e todas as abas | Sim | Sim | Não (404) |
| Editar dados do projeto, dia da reunião | Sim | Não | Não |
| Adicionar/remover membros, mudar papel | Sim | Não | Não |
| Avançar ou retroceder fase | Sim | Não | Não |
| Excluir projeto (só em PLANEJAMENTO, confirmação digitando o nome) | Sim | Não | Não |
| Pessoas do cliente, departamentos, módulos | Sim | Sim | Não |
| Tarefas (criar, editar, mover, bloquear) | Sim | Sim | Não |
| Reunião: criar e editar rascunho | Sim | Sim | Não |
| Reunião: finalizar (congela a ata) | Sim | Não | Não |
| Evidências: criar, subir versão, registrar tentativa | Sim | Sim | Não |
| Evidência: marcar ACEITE_TACITO | Sim | Não | Não |
| Treinamentos, presença, usuários-chave | Sim | Sim | Não |
| Wiki do cliente | Sim | Sim | Não |
| Migração: itens e contagens | Sim | Sim | Não |
| Critérios de check-out: marcar atendido | Sim | Não | Não |
| Ver histórico de alterações | Sim | Sim | Não |

Regras de implementação:

- Toda permissão é checada **no servidor** (Server Action ou Route Handler), nunca só escondendo botão.
- Não membro recebe `notFound()` (404), não 403, para não revelar que o projeto existe.
- O último Líder de um projeto não pode ser removido nem rebaixado.

---

## 4. Ciclo de vida da implantação

Fases fixas, em ordem (`FaseProjeto`):

```
PLANEJAMENTO → EXECUCAO → CHECKOUT → HANDOVER → TRANSICAO → ENCERRADO
```

| Transição | Portão (validado no servidor) |
|---|---|
| PLANEJAMENTO → EXECUCAO | Existem evidências `ATA_ABERTURA` e `TERMO_DADOS_LEGADOS` com status diferente de `RASCUNHO` (RN04 + RN02) |
| EXECUCAO → CHECKOUT | Existe pelo menos 1 módulo |
| CHECKOUT → HANDOVER | Os 4 critérios de check-out estão atendidos (RN05). Ao avançar: grava `dataProntidao` (D+0) e cria a reunião `PRONTIDAO` em rascunho |
| HANDOVER → TRANSICAO | A reunião `PRONTIDAO` está finalizada |
| TRANSICAO → ENCERRADO | Passaram 20 dias corridos desde `dataProntidao` (RN06) |
| Retroceder uma fase | Permitido ao Líder, exceto a partir de ENCERRADO; motivo obrigatório |

- Toda mudança de fase exige um **motivo** (texto livre, mínimo 10 caracteres) e grava `HistoricoAlteracao` com `campo = "fase"` e o motivo.
- A tela de fase mostra cada portão como checklist ("o que falta para avançar"), com link para resolver cada item.
- `StatusProjeto` (ATIVO, AGUARDANDO_PRONTIDAO, PAUSADO, CANCELADO) é independente da fase e alterado manualmente pelo Líder, com motivo. `AGUARDANDO_PRONTIDAO` existe para a evolução futura (estabilização assistida).

---

## 5. Requisitos funcionais

Prioridade MoSCoW. Must = MVP.

| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | Abrir a implantação a partir do handoff comercial e mostrar o prazo de abertura em dias úteis | Must |
| RF02 | Conduzir o projeto pelo ciclo de vida fixo com portões (seção 4) | Must |
| RF03 | Registrar os módulos implantados com status, percentual de evolução, aderência e peso | Must |
| RF04 | Criar tarefas por módulo e departamento, com responsável, prazo e parte responsável (contratada ou contratante) | Must |
| RF05 | Agendar treinamentos, registrar presença e marcar usuários-chave que operam com autonomia | Must |
| RF06 | Manter a wiki do cliente (particularidades, regras locais, perfis, contatos), com histórico de cada alteração | Must |
| RF07 | Guardar evidências (atas, termos, checklists) com status de assinatura e versões do arquivo | Must |
| RF08 | Registrar a tentativa de formalização sem assinatura: data, canal, destinatário e motivo | Must |
| RF09 | Registrar a reunião semanal na estrutura da ata: participantes de cada parte, status, impedimentos, decisões numeradas, plano de ação e salvaguardas | Must |
| RF10 | Abrir cada ata com as ações da ata anterior e o status de cada uma | Must |
| RF11 | Registrar impedimentos separados de riscos, com categoria e parte responsável | Must |
| RF12 | Controlar itens de migração com contagens, divergência e termo de aceite dos saldos iniciais | Must |
| RF13 | Liberar o handover só com o checklist de check-out completo, cada critério com sua comprovação | Must |
| RF14 | Gerar a Ata de prontidão consolidando módulos, treinamentos e pessoas capacitadas | Must |
| RF15 | Exportar a ata semanal em PDF no formato do modelo, com campos de assinatura | Must |
| RF16 | Registrar riscos com probabilidade × impacto e matriz 5 × 5 | Should |
| RF17 | Visão de carteira: todos os projetos do usuário com fase, saúde e progresso | Should |
| RF18 | Estabilização assistida com contagem regressiva | Could (fora) |
| RF19 | Encerrar a estabilização por falta de cooperação | Could (fora) |
| RF20 | Escalonamento por níveis | Could (fora) |
| RF21 | Assistente de IA para rascunhar atas e organizar a wiki | Won't (agora) |

---

## 6. Regras de negócio

Toda regra de negócio pura fica em `src/lib/regras/` com testes unitários.

| ID | Regra | Implementação |
|---|---|---|
| RN01 | O painel é a fonte única da verdade; alterações relevantes têm autor e data | `HistoricoAlteracao` gravado na mesma transação de cada escrita (seção 9) |
| RN02 | Falta de assinatura nunca paralisa o cronograma; a tentativa registrada vale como evidência | Portões aceitam evidência `ENVIADO`, `ASSINADO`, `RECUSADO` ou `ACEITE_TACITO` onde indicado |
| RN03 | O projeto deve ser aberto em até 48 horas úteis após o handoff | `prazoAbertura = handoffEm + 2 dias úteis`. Painel mostra "aberto no prazo" ou "aberto com X dias úteis de atraso" (`abertoEm` = data de criação) |
| RN04 | O kickoff exige ata de abertura e termo de recebimento dos dados legados | Portão PLANEJAMENTO → EXECUCAO |
| RN05 | Handover só com os 4 critérios de check-out comprovados | Portão CHECKOUT → HANDOVER; regras de cada critério abaixo |
| RN06 | Transição para o suporte regular dura 20 dias corridos a partir do D+0 | Portão TRANSICAO → ENCERRADO; painel mostra a contagem |
| RN07 | Toda ação de ata tem responsável e prazo | Validação Zod: tarefa criada a partir de reunião exige responsável e prazo |
| RN08 | Ata finalizada não muda | Servidor recusa edição de reunião `FINALIZADA` e de tarefas no seu snapshot (as tarefas continuam editáveis; o snapshot da ata, não) |
| RN09 | Documento assinado não é sobrescrito: cada arquivo novo é nova versão | `EvidenciaVersao` só recebe inserts; nunca update/delete de versão |
| RN10 | Percentual do projeto é calculado, nunca digitado | Média ponderada: `Σ(percentual × peso) / Σ(peso)`, arredondada para inteiro; 0 se não houver módulos |
| RN11 | Tarefa bloqueada exige motivo | Zod + servidor |
| RN12 | Item de migração só fica `VALIDADO` com divergência zero ou justificativa | `divergencia = registrosOrigem − registrosImportados`; ambos obrigatórios para validar |

### Critérios de check-out (RN05)

Criados automaticamente (os 4) quando o projeto é criado. Marcar como atendido só é aceito se a comprovação existir:

| Critério (`TipoCriterio`) | Comprovação exigida |
|---|---|
| `SALDOS_INICIAIS_ACEITOS` | Todos os itens de migração `VALIDADO` (e pelo menos 1 item) **e** evidência `TERMO_ACEITE_MIGRACAO` com status `ASSINADO` ou `ACEITE_TACITO` |
| `AUTONOMIA_USUARIOS_CHAVE` | Pelo menos 1 pessoa do cliente com `usuarioChave = true` e `autonomiaConfirmadaEm` preenchida **e** evidência `CHECKLIST` vinculada com status `ASSINADO` ou `ACEITE_TACITO` |
| `INTEGRACOES_OBRIGATORIAS_ATIVAS` | Evidência vinculada (qualquer tipo, exceto `RASCUNHO`) comprovando a integração ativa |
| `WIKI_CONSOLIDADA` | Pelo menos 1 nota em `PARTICULARIDADE` e 1 em `REGRA_LOCAL`; evidência opcional |

A tela de check-out mostra, para cada critério, o que já existe e o que falta, com link direto. Desmarcar um critério é permitido ao Líder, com motivo.

### Status de assinatura da evidência

Transições permitidas (`src/lib/regras/evidencias.ts`):

```
RASCUNHO → ENVIADO          exige pelo menos 1 versão do arquivo
ENVIADO  → ASSINADO         exige nova versão marcada como assinada
ENVIADO  → RECUSADO         exige pelo menos 1 TentativaFormalizacao com motivo
ENVIADO | RECUSADO → ACEITE_TACITO   só Líder; exige pelo menos 1 TentativaFormalizacao
ASSINADO e ACEITE_TACITO são finais
```

### Dias úteis (RNF02)

`src/lib/regras/diasUteis.ts`:

- Dia útil = segunda a sexta, exceto feriados.
- Feriados nacionais calculados em código para qualquer ano: 1/1, Sexta-feira Santa (Páscoa − 2, Páscoa pelo algoritmo de Meeus/Butcher), 21/4, 1/5, 7/9, 12/10, 2/11, 15/11, 20/11, 25/12.
- Feriados extras e municipais vêm da tabela `Feriado` (por projeto ou globais). Tela simples em Configurações do projeto para cadastrá-los.
- Funções: `ehDiaUtil(data, feriados)`, `somarDiasUteis(data, n, feriados)`, `diasUteisEntre(a, b, feriados)`.
- Datas sem hora são strings `YYYY-MM-DD` na lógica e `@db.Date` no banco. Fuso de exibição: `America/Sao_Paulo`.

### Saúde do projeto (calculada)

`src/lib/regras/saude.ts`, limiares em constantes no topo do arquivo:

- `CRITICO`: algum impedimento `ABERTO` há mais de 10 dias úteis, **ou** 5 ou mais tarefas atrasadas com `parteResponsavel = CONTRATADA`.
- `ATENCAO`: qualquer tarefa atrasada ou qualquer impedimento aberto.
- `EM_DIA`: nenhum dos anteriores.
- Tarefa atrasada = não concluída e `prazo < hoje`.

---

## 7. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | Trilha de auditoria em projeto, fase, evidências, wiki, atas, critérios e itens de migração: quem, quando, valor anterior e novo |
| RNF02 | Prazos em dias úteis com feriados nacionais e do município |
| RNF03 | Permissões checadas no servidor |
| RNF04 | Uso pelo celular a partir de 360 px de largura, sem rolagem horizontal da página |
| RNF05 | Upload de PDF, PNG e JPG até 10 MB, em armazenamento externo (Vercel Blob) |
| RNF06 | PDF da ata fiel à estrutura da seção 14 |
| RNF07 | Sigilo (seção 2) |
| RNF08 | Acessibilidade: contraste AA (seção 12), foco visível, todo campo com `<label>`, navegação por teclado em diálogos e quadro |
| RNF09 | Interface em português do Brasil; datas `dd/MM/yyyy`; números com separador brasileiro |

---

## 8. Stack e versões

Antes de escrever código, **confirme as versões estáveis atuais e leia a documentação oficial** de Next.js, Auth.js, Prisma, Tailwind CSS e shadcn/ui. APIs de autenticação e configuração do Prisma mudaram entre versões recentes. Fixe as versões no `package.json` (sem `^` nas libs principais) e registre-as no README.

| Camada | Escolha |
|---|---|
| Framework | Next.js (App Router) + TypeScript estrito, Server Components e Server Actions |
| Banco | PostgreSQL na Neon |
| ORM | Prisma (use o adapter/driver recomendado para Neon na versão escolhida) |
| Autenticação | Auth.js (NextAuth) com provider Credentials (e-mail + senha), sessão JWT; senha com `bcryptjs` |
| Validação | Zod; schemas compartilhados entre formulário e servidor |
| Formulários | React Hook Form + `@hookform/resolvers/zod` |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) tematizado com a paleta da seção 12; ícones `lucide-react` |
| Quadro de tarefas | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Gráficos | Recharts |
| Datas | date-fns + date-fns-tz |
| PDF | `@react-pdf/renderer` em Route Handler (runtime Node.js) |
| Arquivos | `@vercel/blob` (upload pelo cliente com rota de token) |
| Testes | Vitest |
| Qualidade | ESLint, Prettier, `tsc --noEmit` |
| CI | GitHub Actions: install, lint, typecheck, test, build |
| Deploy | Vercel |

Variáveis de ambiente (documentar em `.env.example`):

```
DATABASE_URL=            # Neon, conexão com pooling
DATABASE_URL_UNPOOLED=   # Neon, conexão direta (migrações)
AUTH_SECRET=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_APP_NAME=Marco
NEXT_PUBLIC_ORG_NAME=Sua Empresa
```

---

## 9. Arquitetura e estrutura de pastas

```
.
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (auth)/cadastro/page.tsx
│  │  ├─ (app)/layout.tsx                  # exige sessão
│  │  ├─ (app)/projetos/page.tsx           # lista (e carteira, Sprint 8)
│  │  ├─ (app)/projetos/novo/page.tsx
│  │  ├─ (app)/projetos/[id]/layout.tsx    # exige membro; navegação do projeto
│  │  ├─ (app)/projetos/[id]/page.tsx      # painel
│  │  ├─ (app)/projetos/[id]/<aba>/...     # ver seção 11
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/route.ts
│  │     ├─ upload/route.ts                # token do Vercel Blob
│  │     └─ projetos/[id]/reunioes/[rid]/pdf/route.ts
│  ├─ features/<modulo>/
│  │  ├─ actions.ts                        # Server Actions do módulo
│  │  ├─ schemas.ts                        # Zod
│  │  ├─ queries.ts                        # leituras usadas pelas páginas
│  │  └─ components/
│  ├─ server/
│  │  ├─ db.ts                             # PrismaClient singleton
│  │  ├─ auth.ts                           # configuração Auth.js
│  │  ├─ permissoes.ts                     # exigirSessao, exigirMembro, exigirLider
│  │  ├─ historico.ts                      # registrarHistorico(tx, ...)
│  │  └─ acao.ts                           # wrapper padrão de Server Action
│  ├─ lib/
│  │  ├─ regras/                           # funções puras + *.test.ts
│  │  ├─ formatos.ts                       # datas, números, labels de enums
│  │  └─ constantes.ts
│  ├─ components/ui/                       # shadcn/ui tematizado
│  ├─ components/                          # componentes compartilhados do app
│  └─ pdf/                                 # templates @react-pdf
├─ docs/DECISOES.md
├─ CLAUDE.md
└─ README.md
```

Módulos em `features/`: `projetos`, `equipe`, `fases`, `modulos`, `tarefas`, `reunioes`, `impedimentos`, `evidencias`, `treinamentos`, `wiki`, `migracao`, `checkout`, `painel`, `historico`, `riscos` (Should).

### Padrão de Server Action

Toda escrita segue o mesmo fluxo, implementado em `server/acao.ts`:

1. `exigirSessao()`
2. `exigirMembro(projetoId)` ou `exigirLider(projetoId)` → 404 se não for membro
3. `schema.safeParse(input)` → em erro, retorna `{ ok: false, erro: "Revise os campos destacados", campos }`
4. `prisma.$transaction(async (tx) => { escrita; await registrarHistorico(tx, {...}) })`
5. `revalidatePath(...)`
6. Retorna `{ ok: true, data }` ou `{ ok: false, erro }` com mensagem em português (nunca o erro cru do Prisma)

Regras de portão (fase, critérios, assinatura, migração) são chamadas **dentro** da action, a partir de `lib/regras`, antes da escrita.

### Histórico

`registrarHistorico(tx, { projetoId, entidade, registroId, acao, campo?, valorAnterior?, valorNovo?, motivo?, autorId })`. Em atualizações, grave uma linha por campo alterado. A aba Histórico lista tudo do projeto com filtros por entidade e autor, mais recentes primeiro. Wiki e evidências mostram o próprio histórico no detalhe.

---

## 10. Modelo de dados (schema Prisma)

Ajuste `generator` e `datasource` à versão do Prisma escolhida. Os modelos abaixo são o contrato; nomes em português, sem acento.

```prisma
// ---------- Enums ----------
enum PapelProjeto { LIDER ANALISTA }
enum FaseProjeto { PLANEJAMENTO EXECUCAO CHECKOUT HANDOVER TRANSICAO ENCERRADO }
enum StatusProjeto { ATIVO AGUARDANDO_PRONTIDAO PAUSADO CANCELADO }
enum Parte { CONTRATADA CONTRATANTE }
enum StatusModulo { NAO_INICIADO EM_IMPLANTACAO EM_VALIDACAO IMPLANTADO }
enum StatusTarefa { A_FAZER EM_ANDAMENTO BLOQUEADA CONCLUIDA }
enum Prioridade { BAIXA MEDIA ALTA }
enum TipoReuniao { KICKOFF SEMANAL PRONTIDAO }
enum StatusReuniao { RASCUNHO FINALIZADA }
enum CategoriaImpedimento { INFRAESTRUTURA_CLIENTE PESSOAL_CHAVE DADOS_LEGADOS OUTRO }
enum StatusImpedimento { ABERTO RESOLVIDO }
enum TipoEvidencia { ATA_ABERTURA TERMO_DADOS_LEGADOS ATA_SEMANAL TERMO_ACEITE_MIGRACAO CHECKLIST ATA_PRONTIDAO OUTRO }
enum StatusAssinatura { RASCUNHO ENVIADO ASSINADO RECUSADO ACEITE_TACITO }
enum Canal { EMAIL MENSAGEM PRESENCIAL OUTRO }
enum TipoCriterio { SALDOS_INICIAIS_ACEITOS AUTONOMIA_USUARIOS_CHAVE INTEGRACOES_OBRIGATORIAS_ATIVAS WIKI_CONSOLIDADA }
enum CategoriaNota { PARTICULARIDADE REGRA_LOCAL PERFIL CONTATO }
enum StatusMigracao { PENDENTE EXTRAIDO IMPORTADO VALIDADO DIVERGENTE }
enum AcaoHistorico { CRIAR ATUALIZAR EXCLUIR }
enum EstrategiaRisco { EVITAR MITIGAR TRANSFERIR ACEITAR }   // Should
enum StatusRisco { ABERTO MONITORANDO OCORREU ENCERRADO }    // Should

// ---------- Equipe ----------
model Usuario {
  id           String   @id @default(cuid())
  nome         String
  email        String   @unique
  senhaHash    String
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt
  membros      MembroProjeto[]
  historicos   HistoricoAlteracao[]
  notasWiki    NotaWiki[]
  versoesEnviadas      EvidenciaVersao[]
  tentativasRegistradas TentativaFormalizacao[]
}

model MembroProjeto {
  id        String       @id @default(cuid())
  projetoId String
  usuarioId String
  papel     PapelProjeto
  criadoEm  DateTime     @default(now())
  projeto   Projeto      @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  usuario   Usuario      @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  tarefas       Tarefa[]
  treinamentos  Treinamento[]
  participacoes ParticipanteReuniao[]
  riscos        Risco[]
  @@unique([projetoId, usuarioId])
}

// ---------- Projeto ----------
model Projeto {
  id             String        @id @default(cuid())
  nome           String
  cliente        String
  municipio      String
  uf             String        @db.Char(2)
  handoffEm      DateTime      @db.Date
  abertoEm       DateTime      @default(now())
  inicioPrevisto DateTime?     @db.Date
  fimPrevisto    DateTime?     @db.Date
  fase           FaseProjeto   @default(PLANEJAMENTO)
  status         StatusProjeto @default(ATIVO)
  diaReuniao     Int           @default(4) // 1 = segunda ... 5 = sexta; padrão quinta
  dataProntidao  DateTime?     @db.Date    // D+0
  criadoEm       DateTime      @default(now())
  atualizadoEm   DateTime      @updatedAt

  membros       MembroProjeto[]
  pessoas       PessoaCliente[]
  departamentos Departamento[]
  modulos       Modulo[]
  tarefas       Tarefa[]
  treinamentos  Treinamento[]
  reunioes      Reuniao[]
  impedimentos  Impedimento[]
  riscos        Risco[]
  evidencias    Evidencia[]
  criterios     CriterioCheckout[]
  notas         NotaWiki[]
  itensMigracao ItemMigracao[]
  feriados      Feriado[]
  historicos    HistoricoAlteracao[]
}

// ---------- Cliente ----------
model PessoaCliente {
  id                   String    @id @default(cuid())
  projetoId            String
  departamentoId       String?
  nome                 String
  cargo                String?
  email                String?
  telefone             String?
  usuarioChave         Boolean   @default(false)
  autonomiaConfirmadaEm DateTime? @db.Date
  criadoEm             DateTime  @default(now())
  atualizadoEm         DateTime  @updatedAt
  projeto              Projeto       @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  departamento         Departamento? @relation(fields: [departamentoId], references: [id], onDelete: SetNull)
  presencas            Presenca[]
  participacoes        ParticipanteReuniao[]
  tarefas              Tarefa[]
  tentativas           TentativaFormalizacao[]
}

model NotaWiki {
  id           String        @id @default(cuid())
  projetoId    String
  categoria    CategoriaNota
  titulo       String
  texto        String
  autorId      String
  criadoEm     DateTime      @default(now())
  atualizadoEm DateTime      @updatedAt
  projeto      Projeto       @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  autor        Usuario       @relation(fields: [autorId], references: [id])
}

// ---------- Execução ----------
model Departamento {
  id        String  @id @default(cuid())
  projetoId String
  nome      String
  projeto   Projeto @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  pessoas   PessoaCliente[]
  tarefas   Tarefa[]
  itensMigracao ItemMigracao[]
  @@unique([projetoId, nome])
}

model Modulo {
  id           String       @id @default(cuid())
  projetoId    String
  nome         String
  status       StatusModulo @default(NAO_INICIADO)
  percentual   Int          @default(0)  // 0 a 100
  aderencia    Int?                      // 0 a 100
  peso         Int          @default(1)  // 1 a 10
  observacao   String?
  criadoEm     DateTime     @default(now())
  atualizadoEm DateTime     @updatedAt
  projeto      Projeto      @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  tarefas      Tarefa[]
  treinamentos Treinamento[]
  @@unique([projetoId, nome])
}

model Tarefa {
  id                  String       @id @default(cuid())
  projetoId           String
  moduloId            String?
  departamentoId      String?
  responsavelMembroId String?
  responsavelPessoaId String?
  reuniaoOrigemId     String?
  titulo              String
  descricao           String?
  prazo               DateTime?    @db.Date
  prioridade          Prioridade   @default(MEDIA)
  status              StatusTarefa @default(A_FAZER)
  parteResponsavel    Parte        @default(CONTRATADA)
  motivoBloqueio      String?
  ordem               Int          @default(0)
  concluidaEm         DateTime?
  criadoEm            DateTime     @default(now())
  atualizadoEm        DateTime     @updatedAt
  projeto           Projeto        @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  modulo            Modulo?        @relation(fields: [moduloId], references: [id], onDelete: SetNull)
  departamento      Departamento?  @relation(fields: [departamentoId], references: [id], onDelete: SetNull)
  responsavelMembro MembroProjeto? @relation(fields: [responsavelMembroId], references: [id], onDelete: SetNull)
  responsavelPessoa PessoaCliente? @relation(fields: [responsavelPessoaId], references: [id], onDelete: SetNull)
  reuniaoOrigem     Reuniao?       @relation(fields: [reuniaoOrigemId], references: [id], onDelete: SetNull)
  @@index([projetoId, status])
}

// ---------- Capacitação ----------
model Treinamento {
  id                String    @id @default(cuid())
  projetoId         String
  moduloId          String?
  instrutorMembroId String?
  titulo            String
  data              DateTime  @db.Date
  horaInicio        String?   // "HH:mm"
  duracaoMin        Int?
  local             String?
  observacao        String?
  criadoEm          DateTime  @default(now())
  atualizadoEm      DateTime  @updatedAt
  projeto   Projeto        @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  modulo    Modulo?        @relation(fields: [moduloId], references: [id], onDelete: SetNull)
  instrutor MembroProjeto? @relation(fields: [instrutorMembroId], references: [id], onDelete: SetNull)
  presencas Presenca[]
}

model Presenca {
  id              String        @id @default(cuid())
  treinamentoId   String
  pessoaClienteId String
  presente        Boolean       @default(false)
  treinamento     Treinamento   @relation(fields: [treinamentoId], references: [id], onDelete: Cascade)
  pessoa          PessoaCliente @relation(fields: [pessoaClienteId], references: [id], onDelete: Cascade)
  @@unique([treinamentoId, pessoaClienteId])
}

// ---------- Governança ----------
model Reuniao {
  id             String        @id @default(cuid())
  projetoId      String
  tipo           TipoReuniao
  numero         Int           // sequencial por projeto, todos os tipos
  data           DateTime      @db.Date
  horaInicio     String?
  horaFim        String?
  local          String?
  resumoStatus   String?
  salvaguardas   String?
  status         StatusReuniao @default(RASCUNHO)
  percentualNoDia Int?         // gravado ao finalizar
  snapshot       Json?         // conteúdo congelado da ata ao finalizar
  finalizadaEm   DateTime?
  criadoEm       DateTime      @default(now())
  atualizadoEm   DateTime      @updatedAt
  projeto       Projeto     @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  participantes ParticipanteReuniao[]
  decisoes      Decisao[]
  acoes         Tarefa[]
  impedimentos  Impedimento[]
  evidencias    Evidencia[]
  @@unique([projetoId, numero])
}

model ParticipanteReuniao {
  id              String  @id @default(cuid())
  reuniaoId       String
  parte           Parte
  membroId        String?
  pessoaClienteId String?
  nomeAvulso      String? // participante sem cadastro
  reuniao Reuniao        @relation(fields: [reuniaoId], references: [id], onDelete: Cascade)
  membro  MembroProjeto? @relation(fields: [membroId], references: [id], onDelete: SetNull)
  pessoa  PessoaCliente? @relation(fields: [pessoaClienteId], references: [id], onDelete: SetNull)
}

model Decisao {
  id        String  @id @default(cuid())
  reuniaoId String
  numero    Int
  texto     String
  reuniao   Reuniao @relation(fields: [reuniaoId], references: [id], onDelete: Cascade)
  @@unique([reuniaoId, numero])
}

model Impedimento {
  id               String               @id @default(cuid())
  projetoId        String
  reuniaoId        String?
  categoria        CategoriaImpedimento
  descricao        String
  parteResponsavel Parte
  status           StatusImpedimento    @default(ABERTO)
  abertoEm         DateTime             @default(now()) @db.Date
  resolvidoEm      DateTime?            @db.Date
  resolucao        String?
  projeto Projeto  @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  reuniao Reuniao? @relation(fields: [reuniaoId], references: [id], onDelete: SetNull)
}

model Risco { // Should — Sprint 8
  id                  String          @id @default(cuid())
  projetoId           String
  descricao           String
  probabilidade       Int             // 1 a 5
  impacto             Int             // 1 a 5
  estrategia          EstrategiaRisco
  planoResposta       String?
  responsavelMembroId String?
  status              StatusRisco     @default(ABERTO)
  criadoEm            DateTime        @default(now())
  atualizadoEm        DateTime        @updatedAt
  projeto     Projeto        @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  responsavel MembroProjeto? @relation(fields: [responsavelMembroId], references: [id], onDelete: SetNull)
}

// ---------- Formalização ----------
model Evidencia {
  id               String           @id @default(cuid())
  projetoId        String
  reuniaoId        String?
  tipo             TipoEvidencia
  titulo           String
  statusAssinatura StatusAssinatura @default(RASCUNHO)
  criadoEm         DateTime         @default(now())
  atualizadoEm     DateTime         @updatedAt
  projeto    Projeto  @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  reuniao    Reuniao? @relation(fields: [reuniaoId], references: [id], onDelete: SetNull)
  versoes    EvidenciaVersao[]
  tentativas TentativaFormalizacao[]
  criterios  CriterioCheckout[]
  itensMigracao ItemMigracao[]
}

model EvidenciaVersao { // somente insert (RN09)
  id           String   @id @default(cuid())
  evidenciaId  String
  numero       Int
  arquivoUrl   String
  nomeArquivo  String
  mimeType     String
  tamanhoBytes Int
  assinada     Boolean  @default(false)
  enviadoPorId String
  criadoEm     DateTime @default(now())
  evidencia  Evidencia @relation(fields: [evidenciaId], references: [id], onDelete: Cascade)
  enviadoPor Usuario   @relation(fields: [enviadoPorId], references: [id])
  @@unique([evidenciaId, numero])
}

model TentativaFormalizacao {
  id                  String   @id @default(cuid())
  evidenciaId         String
  destinatarioId      String
  registradoPorId     String
  enviadoEm           DateTime @db.Date
  canal               Canal
  motivoNaoAssinatura String?
  criadoEm            DateTime @default(now())
  evidencia     Evidencia     @relation(fields: [evidenciaId], references: [id], onDelete: Cascade)
  destinatario  PessoaCliente @relation(fields: [destinatarioId], references: [id])
  registradoPor Usuario       @relation(fields: [registradoPorId], references: [id])
}

model CriterioCheckout {
  id            String       @id @default(cuid())
  projetoId     String
  tipo          TipoCriterio
  atendido      Boolean      @default(false)
  evidenciaId   String?
  observacao    String?
  atendidoEm    DateTime?
  atendidoPorId String?
  projeto   Projeto    @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  evidencia Evidencia? @relation(fields: [evidenciaId], references: [id], onDelete: SetNull)
  @@unique([projetoId, tipo])
}

// ---------- Migração ----------
model ItemMigracao {
  id                  String         @id @default(cuid())
  projetoId           String
  departamentoId      String?
  evidenciaAceiteId   String?
  entidade            String         // ex.: "Cadastro de servidores", "Saldos contábeis"
  registrosOrigem     Int?
  registrosImportados Int?
  status              StatusMigracao @default(PENDENTE)
  justificativa       String?
  criadoEm            DateTime       @default(now())
  atualizadoEm        DateTime       @updatedAt
  projeto         Projeto       @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  departamento    Departamento? @relation(fields: [departamentoId], references: [id], onDelete: SetNull)
  evidenciaAceite Evidencia?    @relation(fields: [evidenciaAceiteId], references: [id], onDelete: SetNull)
}

// ---------- Apoio ----------
model Feriado {
  id        String   @id @default(cuid())
  projetoId String?  // null = vale para todos os projetos
  data      DateTime @db.Date
  nome      String
  projeto   Projeto? @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  @@index([projetoId, data])
}

model HistoricoAlteracao {
  id            String        @id @default(cuid())
  projetoId     String
  autorId       String
  entidade      String        // "Projeto", "Evidencia", "NotaWiki"...
  registroId    String
  acao          AcaoHistorico
  campo         String?
  valorAnterior Json?
  valorNovo     Json?
  motivo        String?
  criadoEm      DateTime      @default(now())
  projeto Projeto @relation(fields: [projetoId], references: [id], onDelete: Cascade)
  autor   Usuario @relation(fields: [autorId], references: [id])
  @@index([projetoId, criadoEm])
  @@index([entidade, registroId])
}
```

Notas:

- Ao criar um projeto, na mesma transação: `MembroProjeto` do criador como `LIDER` e os 4 `CriterioCheckout`.
- `Reuniao.numero` = maior número do projeto + 1, calculado dentro da transação.
- Se o Prisma reclamar de relações ambíguas, nomeie as relações (`@relation("...")`) sem mudar os campos.

---

## 11. Telas e rotas

Navegação do projeto (barra lateral no desktop; menu em gaveta no celular), nesta ordem:

| Rota | Tela | Conteúdo principal |
|---|---|---|
| `/login`, `/cadastro` | Autenticação | Layout dividido: painel verde à esquerda com nome e frase do produto, formulário à direita (no celular, só o formulário com faixa verde no topo) |
| `/projetos` | Meus projetos | Cards: nome, cliente, fase, saúde, percentual, próximo marco. Botão "Nova implantação". Sprint 8: alternar para visão de carteira em tabela |
| `/projetos/novo` | Nova implantação | Nome, cliente, município, UF, data do handoff, início e fim previstos, departamentos iniciais (lista editável) |
| `/projetos/[id]` | Painel | Ver abaixo |
| `/projetos/[id]/fases` | Ciclo de vida | Linha do tempo das 6 fases; fase atual destacada; checklist do portão da próxima fase; botões Avançar/Retroceder (Líder) com diálogo de motivo |
| `/projetos/[id]/modulos` | Módulos | Tabela editável: nome, status, percentual (slider + número), aderência, peso; gráfico de barras horizontais do percentual por módulo |
| `/projetos/[id]/tarefas` | Tarefas | Alternar Quadro (colunas por status, arrastar) e Lista (tabela com filtros: módulo, departamento, responsável, parte, atrasadas). Bloquear abre diálogo de motivo |
| `/projetos/[id]/reunioes` | Reuniões | Lista com número, tipo, data, status; botão "Nova reunião semanal" já com a próxima data no dia configurado |
| `/projetos/[id]/reunioes/[rid]` | Ata | Formulário em seções na ordem do PDF (seção 14); seção "Ações da reunião anterior" carregada automaticamente; botões "Baixar PDF" e "Finalizar ata" (Líder) |
| `/projetos/[id]/evidencias` | Evidências | Tabela por tipo e status; detalhe com versões, upload de nova versão, tentativas de formalização, histórico, ações de mudança de status conforme as transições válidas |
| `/projetos/[id]/treinamentos` | Treinamentos | Agenda (lista por data); detalhe com lista de presença (checkbox por pessoa) |
| `/projetos/[id]/pessoas` | Pessoas do cliente | Tabela: nome, cargo, departamento, contato, usuário-chave, autonomia confirmada em |
| `/projetos/[id]/wiki` | Wiki do cliente | Notas por categoria (abas), busca por texto, editor de texto simples (textarea com Markdown renderizado), histórico por nota |
| `/projetos/[id]/migracao` | Migração | Tabela: entidade, departamento, origem, importados, divergência (calculada, destacada se ≠ 0), status, justificativa; vincular termo de aceite |
| `/projetos/[id]/checkout` | Check-out | 4 cartões de critério com "o que já existe / o que falta", evidência vinculada, botão "Marcar atendido" (Líder) |
| `/projetos/[id]/equipe` | Equipe | Membros e papéis; adicionar por e-mail de usuário já cadastrado (se não existir: "Peça para a pessoa criar a conta e tente de novo") |
| `/projetos/[id]/historico` | Histórico | Lista cronológica com filtros |
| `/projetos/[id]/configuracoes` | Configurações | Dados do projeto, dia da reunião, status, feriados municipais, excluir projeto |
| `/projetos/[id]/riscos` | Riscos (Sprint 8) | Registro e matriz 5 × 5 |

### Painel do projeto

Cabeçalho: nome, cliente, município/UF, fase atual (badge), saúde (badge), status se não for ATIVO.

Cards, em grade responsiva:

1. **Progresso**: percentual acumulado (RN10) em número grande + barra.
2. **Fase e prazo**: fase atual, prazo de abertura cumprido ou não (RN03); em TRANSICAO, dias restantes (RN06).
3. **Tarefas atrasadas**: total, dividido por Contratada × Contratante, link para a lista filtrada.
4. **Impedimentos abertos**: total e o mais antigo, com dias úteis em aberto.
5. **Check-out**: X de 4 critérios atendidos.
6. **Migração**: itens validados / total, divergências.
7. **Próximos eventos**: próxima reunião e próximos treinamentos.
8. **Progresso por módulo**: barras horizontais (Recharts).

### Estados de interface

Toda lista tem estado vazio com frase útil e ação ("Nenhum treinamento agendado. Agendar o primeiro"). Toda página tem `loading.tsx` com skeleton e `error.tsx` com mensagem em português. Ações mostram toast de sucesso ou erro.

---

## 12. Design system e paleta

### Paleta de origem

| Token | Hex | Origem |
|---|---|---|
| `brand-500` | `#A2BB40` | Verde principal da paleta |
| `brand-600` | `#8FA735` | Linha divisória da paleta |
| `canvas` | `#F8FAFC` | Fundo claro da paleta |

### Escala derivada (mesmo matiz) e neutros

```css
/* src/app/globals.css — Tailwind v4 */
@theme {
  --color-brand-50:  #F8FBEF;
  --color-brand-100: #F0F6DA;
  --color-brand-200: #E0EAB8;
  --color-brand-300: #CBDA90;
  --color-brand-400: #B6CA68;
  --color-brand-500: #A2BB40;
  --color-brand-600: #8FA735;
  --color-brand-700: #708226;
  --color-brand-800: #566321;
  --color-brand-900: #414A1C;
  --color-brand-950: #272C11;

  --color-canvas:  #F8FAFC;  /* fundo da aplicação */
  --color-surface: #FFFFFF;  /* cards, tabelas, diálogos */
  --color-line:    #E2E8F0;  /* bordas */
  --color-ink:     #0F172A;  /* texto principal */
  --color-muted:   #475569;  /* texto secundário */

  --color-danger:  #B91C1C;
  --color-warning: #B45309;
  --color-info:    #1D4ED8;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius-card: 0.75rem;
}
```

Mapeie as variáveis do shadcn/ui para estes tokens: `--primary` = brand-500, `--primary-foreground` = brand-950, `--ring` = brand-700, `--background` = canvas, `--card` = surface, `--border` = line, `--foreground` = ink, `--muted-foreground` = muted, `--destructive` = danger.

### Regras de contraste (obrigatórias)

Contraste medido (WCAG):

| Combinação | Contraste | Uso |
|---|---|---|
| brand-950 sobre brand-500 | 6,7 : 1 | Texto de botão primário e itens da barra lateral |
| brand-950 sobre brand-600 | 5,3 : 1 | Hover e item ativo da barra lateral |
| brand-800 sobre canvas | 6,3 : 1 | Links e texto de destaque |
| muted sobre canvas | 7,2 : 1 | Texto secundário |
| branco sobre brand-500 | 2,2 : 1 | **Proibido** para texto |
| branco sobre brand-600 | 2,7 : 1 | **Proibido** para texto |

- O verde da marca é cor de **superfície e destaque**, nunca de texto sobre fundo claro (exceto brand-800 ou mais escuro).
- Foco visível: `ring-2 ring-brand-700 ring-offset-2 ring-offset-canvas`.

### Aplicação

- **Barra lateral do projeto (desktop)**: fundo brand-500, texto brand-950, item ativo brand-600, borda direita 2 px brand-600 (como a linha da paleta). Conteúdo principal em canvas. No celular, barra superior brand-500 com menu em gaveta.
- **Botões**: primário = brand-500 / texto brand-950 / hover brand-600; secundário = surface com borda line e texto ink; perigo = danger com texto branco.
- **Cards**: surface, borda line, raio 0.75rem, sem sombra pesada (no máximo `shadow-sm`).
- **Gráficos**: barras em brand-500; referência ou meta em brand-800; grade em line.
- **Tipografia**: Inter via `next/font`; títulos de página 24 px semibold; seção 18 px semibold; corpo 14–16 px.
- **Modo escuro**: fora do MVP.

### Badges de status

| Uso | Cores (fundo / texto) |
|---|---|
| Fase atual, Implantado, Concluída, Assinado, Validado, Em dia | brand-100 / brand-900 |
| Em andamento, Enviado, Importado, Atenção | `#FEF3C7` / `#92400E` |
| Bloqueada, Recusado, Divergente, Crítico | `#FEE2E2` / `#991B1B` |
| A fazer, Rascunho, Pendente, Não iniciado | `#F1F5F9` / `#334155` |
| Aceite tácito | `#E0E7FF` / `#3730A3` |
| Parte: Contratada | brand-50 com borda brand-300 / brand-900 |
| Parte: Contratante | `#F1F5F9` com borda `#CBD5E1` / `#334155` |

Todo badge tem texto, nunca só cor. Labels em português ficam em `lib/formatos.ts` (ex.: `ACEITE_TACITO` → "Aceite tácito").

---

## 13. Decisões provisórias

Pontos ambíguos do processo de referência, resolvidos assim até validação. Implemente cada um isolado em função ou constante fácil de trocar e liste-os em `docs/DECISOES.md`.

| # | Ambiguidade | Decisão provisória |
|---|---|---|
| A1 | Estabilização antes ou depois do handover | Fora do MVP; quando existir, entra depois do handover |
| A2 | O que é o D+0 | Data em que o projeto avança para HANDOVER (`dataProntidao`) |
| A3 | A transição é um ciclo ou uma reunião | Ciclo de 20 dias corridos a partir do D+0 |
| A4 | Checklist é área própria ou evidência | É evidência do tipo `CHECKLIST` |
| A5 | Cliente não assina o termo de aceite | Tentativa registrada + `ACEITE_TACITO` pelo Líder libera o critério |
| A6 | O que conta como falta de cooperação | Fora do MVP (pertence à estabilização) |
| A7 | Dia fixo da reunião | Configurável por projeto; quinta-feira como padrão |
| A8 | Quem atrasou | Campo `parteResponsavel` em tarefas e impedimentos |
| A9 | Como calcular o percentual | Média ponderada pelo peso dos módulos (RN10) |
| A10 | Ata sem revisão das ações anteriores | Seção automática "Ações da reunião anterior" e numeração sequencial |

---

## 14. PDFs

Gerados com `@react-pdf/renderer` em `GET /api/projetos/[id]/reunioes/[rid]/pdf` (exige membro). Fonte Inter registrada no PDF. A4, margens 2 cm, cabeçalho com `NEXT_PUBLIC_ORG_NAME` e `NEXT_PUBLIC_APP_NAME`, rodapé com "Página X de Y" e data de geração.

Se a reunião estiver `FINALIZADA`, o PDF usa **somente** o `snapshot`. Em rascunho, usa os dados atuais e traz a marca d'água "RASCUNHO".

### Ata semanal (tipo SEMANAL ou KICKOFF)

1. **Cabeçalho**: título "Ata de reunião semanal de governança" (ou "Ata de abertura" no KICKOFF), nº da ata, projeto, cliente, município/UF, data, horário, local.
2. **Participantes**: duas listas, Contratada e Contratante.
3. **Status do cronograma**: percentual acumulado (gravado na data) + resumo executivo.
4. **Ações da reunião anterior**: tabela ação, responsável, prazo, status atual.
5. **Pontos críticos e impedimentos**: tabela categoria, descrição, parte responsável, aberto desde.
6. **Decisões e realinhamentos**: lista numerada "Decisão 01", "Decisão 02"...
7. **Plano de ação para a próxima semana**: tabela tarefa, responsável, prazo, parte.
8. **Observações gerais e salvaguardas**: texto livre.
9. **Validação e assinaturas**: frase "Os participantes validam as informações, prazos e diretrizes registradas nesta ata." e duas linhas de assinatura: "Pelo contratante — Gestor do contrato / Secretário responsável" e "Pela contratada — Líder de implantação".

### Ata de prontidão (tipo PRONTIDAO)

Cabeçalho igual, depois: D+0; módulos (nome, status, percentual); treinamentos realizados (data, título, presentes); pessoas capacitadas (usuários-chave com autonomia confirmada); critérios de check-out com a evidência de cada um; assinaturas.

### Finalizar ata

Ação do Líder, numa transação:

1. Valida que toda ação da reunião tem responsável e prazo (RN07).
2. Calcula e grava `percentualNoDia`.
3. Monta e grava `snapshot` (participantes, resumo, ações anteriores com status do momento, impedimentos, decisões, plano de ação, salvaguardas).
4. Status `FINALIZADA`, `finalizadaEm = agora`.
5. Gera o PDF, envia ao Blob e cria (ou atualiza) a `Evidencia` vinculada (`ATA_SEMANAL`, `ATA_ABERTURA` para KICKOFF, `ATA_PRONTIDAO` para PRONTIDAO) com nova `EvidenciaVersao`, status `RASCUNHO`.
6. Histórico.

---

## 15. Seed de demonstração

`prisma/seed.ts`, idempotente (limpa e recria). Tudo fictício.

- **Usuários** (senha de demonstração `Demo@2026`, apenas para o seed):
  - `lider@exemplo.com` — Ana Ribeiro (fictícia)
  - `analista@exemplo.com` — Bruno Costa (fictício)
  - `visitante@exemplo.com` — Carla Mendes (fictícia), sem projetos, para testar o 404
- **Projeto 1**: "Implantação — Município Exemplo de Vale Verde", fase `EXECUCAO`, Ana Líder, Bruno Analista.
  - Departamentos: Recursos Humanos, Contabilidade, Compras, Patrimônio, Protocolo.
  - Módulos: Folha de Pagamento (80%, peso 3), Contabilidade (60%, peso 3), Compras (40%, peso 2), Patrimônio (20%, peso 1), Protocolo (0%, peso 1).
  - 8 pessoas do cliente com cargos genéricos, 2 usuárias-chave (1 com autonomia confirmada).
  - 15 tarefas variadas, incluindo 3 atrasadas da contratante, 1 atrasada da contratada e 1 bloqueada com motivo.
  - Reuniões: nº 1 KICKOFF finalizada, nº 2 e nº 3 SEMANAL finalizadas, nº 4 SEMANAL em rascunho.
  - Evidências: ATA_ABERTURA e TERMO_DADOS_LEGADOS assinadas (arquivos PDF gerados no seed com conteúdo fictício e enviados ao Blob; se `BLOB_READ_WRITE_TOKEN` não existir, use URLs locais de `public/demo/`), 1 termo recusado com tentativa registrada.
  - 2 impedimentos abertos (dados legados pendentes; ausência de pessoal-chave), 1 resolvido.
  - 3 treinamentos com presença.
  - Wiki: 5 notas cobrindo as 4 categorias.
  - Migração: 6 itens em status variados, 1 divergente com justificativa.
  - 1 feriado municipal fictício.
- **Projeto 2**: "Implantação — Câmara Exemplo de Serra Clara", fase `PLANEJAMENTO`, Bruno Líder, Ana Analista, poucos dados.

Comando: `npm run db:seed`. O README explica como entrar com as contas de demonstração.

---

## 16. Testes e CI

### Unitários (Vitest), obrigatórios

`src/lib/regras/`:

- `diasUteis.test.ts`: Páscoa de 2026 e 2027; prazo que atravessa feriado nacional; prazo que atravessa fim de semana; feriado municipal; `somarDiasUteis` a partir de sexta-feira.
- `progresso.test.ts`: sem módulos = 0; média ponderada; arredondamento.
- `saude.test.ts`: cada limiar de `CRITICO`, `ATENCAO`, `EM_DIA`.
- `fases.test.ts`: cada portão, avançar e retroceder, bloqueio a partir de ENCERRADO.
- `evidencias.test.ts`: todas as transições válidas e inválidas.
- `checkout.test.ts`: cada critério atendido e não atendido.
- `migracao.test.ts`: divergência e validação.

### Permissões

Teste das funções de `server/permissoes.ts` com o acesso ao banco simulado: membro passa, não membro recebe 404, Analista recebe recusa em ação de Líder.

### Opcional (se sobrar tempo)

Playwright: login, abrir projeto, tentar handover com critério pendente e ver a recusa.

### CI

`.github/workflows/ci.yml`: Node LTS, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. O build não depende de banco real (use `SKIP_ENV_VALIDATION` ou equivalente).

Scripts no `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:migrate`, `db:seed`, `db:studio`.

---

## 17. Plano de entrega por sprints

Cada sprint termina com: checagens verdes (lint, tipos, testes, build), commit(s) com mensagem `sprint N: <resumo>` e um relatório curto do que foi feito, do que ficou pendente e das decisões tomadas.

### Sprint 0 — Fundação

- [ ] Projeto Next.js + TypeScript estrito, Tailwind v4, shadcn/ui tematizado com a seção 12, ESLint, Prettier
- [ ] Prisma com o schema completo da seção 10 e primeira migração
- [ ] Auth.js com cadastro, login e logout; páginas `/login` e `/cadastro` no layout dividido
- [ ] `server/permissoes.ts`, `server/historico.ts`, `server/acao.ts`
- [ ] `lib/regras/diasUteis.ts` e `progresso.ts` com testes
- [ ] Layout autenticado com barra lateral e menu no celular
- [ ] CI no GitHub Actions; `CLAUDE.md` com convenções; `docs/DECISOES.md`; `.env.example`

Aceite: cadastro, login e logout funcionam; testes de dias úteis passam; CI verde.

### Sprint 1 — Projeto e ciclo de vida

- [ ] Criar projeto (cria Líder e 4 critérios na mesma transação) com prazo de abertura (RF01, RN03)
- [ ] Lista de projetos com cards
- [ ] Tela de fases com portões, avançar e retroceder com motivo (RF02, seção 4)
- [ ] Equipe: adicionar membro por e-mail, mudar papel, remover (regra do último Líder)
- [ ] Pessoas do cliente e departamentos
- [ ] Configurações: dados, dia da reunião, status, feriados municipais
- [ ] Aba Histórico

Aceite: não membro recebe 404; Analista não consegue avançar fase nem pela interface nem chamando a action; cada mudança de fase aparece no histórico com motivo.

### Sprint 2 — Módulos e tarefas

- [ ] Módulos com percentual, aderência e peso; gráfico por módulo (RF03)
- [ ] Tarefas: quadro com arrastar entre status e lista com filtros; parte responsável; bloqueio com motivo (RF04, RN11)
- [ ] Painel do projeto com os cards de progresso, tarefas atrasadas e fase

Aceite: percentual do painel = média ponderada (RN10) e bate com o teste; quadro funciona por teclado.

### Sprint 3 — Reunião semanal e ata

- [ ] Lista de reuniões e criação com número sequencial e data sugerida pelo dia configurado
- [ ] Ata em seções: participantes por parte, resumo, ações anteriores automáticas (RF10), impedimentos (RF11), decisões numeradas, plano de ação criando tarefas com `reuniaoOrigemId`, salvaguardas (RF09)
- [ ] Impedimentos: abrir, resolver com resolução
- [ ] Finalizar ata com snapshot e `percentualNoDia` (RN08), ainda sem PDF

Aceite: depois de finalizada, a ata não muda mesmo que as tarefas mudem; a reunião seguinte mostra as ações da anterior com o status atual.

### Sprint 4 — Evidências, formalização e PDF

- [ ] Rota de upload do Vercel Blob (PDF, PNG, JPG até 10 MB)
- [ ] Evidências: criar, subir versão, marcar versão assinada, transições de status (RF07, RN09)
- [ ] Tentativa de formalização com data, canal, destinatário e motivo (RF08)
- [ ] PDF da ata semanal e de abertura (RF15, seção 14); finalizar ata passa a gerar a evidência
- [ ] Portão PLANEJAMENTO → EXECUCAO usando as evidências de kickoff

Aceite: versão nunca é sobrescrita; transição inválida é recusada pelo servidor; PDF segue a ordem da seção 14.

### Sprint 5 — Treinamentos e wiki do cliente

- [ ] Treinamentos com agenda e presença (RF05)
- [ ] Usuários-chave e confirmação de autonomia nas pessoas do cliente
- [ ] Wiki com categorias, busca e histórico por nota (RF06)

Aceite: o histórico de uma nota mostra autor, data e texto anterior.

### Sprint 6 — Migração de dados

- [ ] Itens de migração com contagens, divergência calculada, status e justificativa (RF12, RN12)
- [ ] Vincular termo de aceite (evidência `TERMO_ACEITE_MIGRACAO`)
- [ ] Card de migração no painel

Aceite: item não fica `VALIDADO` com divergência sem justificativa.

### Sprint 7 — Check-out, handover e painel completo

- [ ] Tela de check-out com os 4 critérios, o que existe e o que falta (RF13)
- [ ] Portão CHECKOUT → HANDOVER, D+0, reunião `PRONTIDAO` e PDF da Ata de prontidão (RF14)
- [ ] Portões HANDOVER → TRANSICAO → ENCERRADO com contagem de 20 dias
- [ ] Painel completo (todos os cards da seção 11) e saúde do projeto
- [ ] README de portfólio (seção 20)

Aceite: o servidor recusa o handover com qualquer critério pendente; seed permite demonstrar o fluxo inteiro.

### Sprint 8 — Should

- [ ] Riscos: registro e matriz 5 × 5 colorida por severidade (probabilidade × impacto; 15 ou mais = crítico) (RF16)
- [ ] Visão de carteira em `/projetos`: tabela com fase, saúde, percentual, check-out e impedimentos de todos os projetos do usuário (RF17)

---

## 18. Definição de pronto

Vale para toda história:

- Validação Zod no cliente e no servidor, mensagens em português
- Permissão checada no servidor (tabela da seção 3)
- Histórico gravado nas entidades da RNF01
- Funciona a partir de 360 px sem rolagem horizontal
- Estados vazio, carregando e erro
- Contraste e foco conforme a seção 12
- Regras puras com teste em `lib/regras`
- Lint, tipos, testes e build verdes
- Nada real (seção 2)

---

## 19. Fora do escopo

Estabilização assistida (RF18, RF19), escalonamento (RF20), IA (RF21), papéis de leitura para coordenador, relacionamento, auditoria e suporte, integração com plataformas de assinatura, envio de e-mails, convites por e-mail, múltiplas organizações, modo escuro, aplicativo nativo, Gantt e importação de arquivos de migração.

---

## 20. README do repositório

Estrutura do `README.md` (escrito na Sprint 7):

1. Nome e uma frase do produto
2. Captura do painel (dados do seed)
3. Problema e proposta de valor
4. Funcionalidades por módulo
5. Decisões de arquitetura: ciclo de vida com portões, trilha de auditoria, versões imutáveis de evidência, dias úteis com feriados, snapshot da ata
6. Stack com versões
7. Como rodar localmente (variáveis, migração, seed, contas de demonstração)
8. Testes
9. Roadmap (seção 19)
10. Aviso: "Projeto pessoal de estudo. Todos os dados são fictícios."
