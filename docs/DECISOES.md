# Decisões

Registro de decisões de produto e técnicas. A especificação (`ESPECIFICACAO.md`) é a fonte da verdade.
Aqui ficam: (1) as decisões provisórias da seção 13 e onde estão implementadas; (2) pontos que a
especificação não cobre, resolvidos pela opção mais simples.

## Decisões provisórias da especificação (seção 13)

| #   | Ambiguidade                               | Decisão provisória                                                  | Onde fica                        |
| --- | ----------------------------------------- | ------------------------------------------------------------------- | -------------------------------- |
| A1  | Estabilização antes ou depois do handover | Fora do MVP; quando existir, entra depois do handover               | —                                |
| A2  | O que é o D+0                             | Data em que o projeto avança para HANDOVER (`dataProntidao`)        | Sprint 7                         |
| A3  | A transição é um ciclo ou uma reunião     | Ciclo de 20 dias corridos a partir do D+0                           | Sprint 7                         |
| A4  | Checklist é área própria ou evidência     | É evidência do tipo `CHECKLIST`                                     | Sprint 4/7                       |
| A5  | Cliente não assina o termo de aceite      | Tentativa registrada + `ACEITE_TACITO` pelo Líder libera o critério | Sprint 4/7                       |
| A6  | O que conta como falta de cooperação      | Fora do MVP (pertence à estabilização)                              | —                                |
| A7  | Dia fixo da reunião                       | Configurável por projeto; quinta-feira como padrão                  | `Projeto.diaReuniao @default(4)` |
| A8  | Quem atrasou                              | Campo `parteResponsavel` em tarefas e impedimentos                  | schema                           |
| A9  | Como calcular o percentual                | Média ponderada pelo peso dos módulos (RN10)                        | `src/lib/regras/progresso.ts`    |
| A10 | Ata sem revisão das ações anteriores      | Seção automática "Ações da reunião anterior" e numeração sequencial | Sprint 3                         |

## Decisões tomadas durante a construção

### Sprint 0

**D01 — Auth.js v5 em beta (`next-auth@5.0.0-beta.32`).**
Não existe versão estável do Auth.js para o App Router: o v4 estável (`4.24.x`) usa a API antiga e a
documentação oficial manda instalar `next-auth@beta`. A versão fica fixada no `package.json`.
Credentials + JWT dispensa adapter, então não usamos `@auth/prisma-adapter` (o schema também não tem
tabelas Account/Session).

**D02 — Prisma 7.10.0, não a tag `latest`.**
No npm, `prisma@latest` aponta para `8.0.0-rc.22` (release candidate). Usamos a última estável, 7.10.0.
Consequências da versão 7: gerador `prisma-client` com `output` em `src/generated/prisma` (não
versionado, gerado no `postinstall`); URL da CLI em `prisma.config.ts` (`DATABASE_URL_UNPOOLED`);
client sempre com driver adapter (`PrismaNeon`, Pool via WebSocket, que suporta transações interativas);
`"type": "module"` no package.json.

**D03 — `cacheComponents` desligado.**
O template do Next 16.4 vem com `cacheComponents` e `partialPrefetching` ligados. Com eles, toda leitura
de sessão precisaria ficar dentro de `<Suspense>`, e ler a sessão no topo de um layout vira erro de build.
O app é inteiro autenticado e dinâmico, então ficamos no modelo sem Cache Components, que continua
documentado e suportado. Para religar no futuro, é preciso revisar layouts e páginas.

**D04 — Token `muted` da paleta.**
Na seção 12, `--color-muted` (#475569) é cor de texto secundário. No shadcn/ui, `muted` é cor de fundo
(`bg-muted`) e `muted-foreground` é o texto. Seguindo o mapeamento da própria seção 12
(`--muted-foreground` = muted), o #475569 fica disponível como `text-muted-foreground`, e `bg-muted` vira
um fundo neutro claro (#F1F5F9, o mesmo dos badges "A fazer/Rascunho"). Não existe a classe
`text-muted` com o valor da spec.

**D05 — TypeScript 6.0.3 e ESLint 9.39.5.**
TypeScript 7 e ESLint 10 já existem, mas o `typescript-eslint` só aceita TS abaixo da 6.1, e o
`eslint-plugin-react` (que vem no `eslint-config-next`) só aceita ESLint até a 9.

**D06 — Seed incremental.**
O seed da seção 15 não aparece em nenhuma sprint, mas o aceite da Sprint 7 depende dele. Ele cresce junto
com cada sprint. Na Sprint 0 cria só os 3 usuários de demonstração. A limpeza apaga apenas os usuários de
demonstração e os projetos em que eles são membros, para não apagar dados de outras contas no mesmo banco.

**D07 — Proteção de rotas sem `proxy.ts`.**
A sessão é checada no servidor: no layout `(app)` (`exigirSessao`) e em cada Server Action. Não usamos
`proxy.ts` (o antigo middleware) como barreira, para que exista um único caminho de checagem. Se o
usuário da sessão não existir mais no banco, ele é tratado como deslogado.

**D08 — Recusa a Analista vs. 404.**
Não membro recebe `notFound()` (404). Membro Analista que chama uma action de Líder recebe
`{ ok: false, erro: "Apenas o Líder do projeto pode fazer isso." }`. Um 404 nesse caso seria mentira,
porque a pessoa vê o projeto.

**D09 — Senha.**
Mínimo de 8 caracteres e máximo de 72 (limite do bcrypt). A especificação não define política de senha.

**D10 — Primeira migração gerada offline.**
Sem credenciais da Neon na Sprint 0, a migração `20261011000000_inicial` foi gerada com
`prisma migrate diff --from-empty`. Para aplicar: `npm run db:deploy` (ou `npm run db:migrate`).

**D11 — Projeto de referência só como inspiração.**
O repositório interno usado como referência tem dados reais (empresa, município, códigos, pessoas).
Por decisão do usuário em 11/10/2026, ele serve só de inspiração de UI/UX e de soluções técnicas para o
que já está na especificação. Nada dele é copiado. Desde então, as sprints 1 a 8 rodam em sequência.

### Sprint 1

**D12 — "Próximo marco" no card do projeto.**
A seção 11 cita "próximo marco" sem defini-lo. Usamos a próxima fase do ciclo de vida e quantos itens
do portão ainda faltam ("Check-out · 1 pendência"). Em ENCERRADO: "Projeto encerrado".

**D13 — Departamentos dentro de Pessoas do cliente.**
A seção 11 não tem rota própria para departamentos. Eles são geridos numa aba da tela
`/projetos/[id]/pessoas` (Pessoas | Departamentos). Nomes repetidos, sem diferenciar maiúsculas, são
recusados; na criação do projeto, linhas vazias e repetidas são descartadas.

**D14 — Exclusão de projeto apaga o histórico.**
`HistoricoAlteracao` tem `onDelete: Cascade` no schema. Por isso, excluir o projeto (só em
PLANEJAMENTO, digitando o nome) apaga também o histórico dele. O diálogo avisa isso.

**D15 — Navegação só com abas prontas.**
A barra lateral do projeto mostra só as abas já implementadas, e os links "Resolver" do portão só
aparecem quando a aba de destino existe. Assim nenhum link leva a um 404.

**D16 — Histórico além do mínimo da RNF01.**
Além das entidades da RNF01, equipe, pessoas do cliente, departamentos e feriados também gravam
histórico (pelo padrão de Server Action). Valores aparecem legíveis (enums traduzidos, datas dd/MM/yyyy,
departamento pelo nome, não pelo id).

**D17 — Pessoa com tentativa de formalização não pode ser excluída.**
`TentativaFormalizacao.destinatario` não tem `onDelete` no schema (Restrict). A action recusa a
exclusão com uma mensagem clara, em vez de deixar o erro do banco aparecer.

**D18 — Analista vê Configurações só para leitura.**
A tabela da seção 3 libera para o Analista "ver o projeto e todas as abas", mas só o Líder edita dados,
dia da reunião, status e feriados. A tela abre para todos, com os campos desabilitados para o Analista.
A checagem real é na action.

**D19 — Schemas idempotentes.**
O formulário valida e transforma no cliente (ex.: `""` → `null`), e a action valida de novo com o mesmo
schema. Por isso as transformações aceitam a própria saída (`null`), o que mantém um único schema por
formulário (seção 8).

### Sprint 2

**D20 — Motivo do bloqueio com no mínimo 10 caracteres.**
A RN11 diz só "tarefa bloqueada exige motivo". Para não aceitar motivos vazios de sentido ("x"),
usamos o mesmo mínimo dos outros motivos do sistema (10 caracteres, `MOTIVO_MIN_CARACTERES`). Ao sair de
BLOQUEADA, o motivo é limpo; ao concluir, `concluidaEm` é gravado e, ao reabrir, limpo.

**D21 — Responsável da tarefa: equipe ou cliente.**
O schema tem `responsavelMembroId` e `responsavelPessoaId`. A tela usa um único campo "Responsável",
com dois grupos (equipe da contratada e pessoas do cliente). Só um dos dois é gravado. A "parte
responsável" continua sendo um campo separado (A8), escolhido pelo usuário.

**D22 — Quadro: arrastar, teclado e menu "Mover para".**
O quadro usa @dnd-kit com sensor de teclado (espaço/Enter pega, setas movem, espaço/Enter solta, Esc
cancela) e anúncios em português para leitores de tela. Cada cartão também tem o menu "Mover para",
um caminho alternativo que não depende de arrastar. Soltar em "Bloqueada" abre o diálogo de motivo
antes de gravar; cancelar devolve a tarefa à posição original.

**D23 — Nome de módulo único sem diferenciar maiúsculas.**
O `@@unique([projetoId, nome])` do banco diferencia maiúsculas. A action recusa "folha de pagamento"
quando já existe "Folha de Pagamento".

**D24 — Gráfico de módulos acessível.**
A brand-500 tem contraste 2,1:1 com o branco (validado com o script de paleta). Por isso as barras levam
contorno brand-700, rótulo de valor e uma tabela equivalente para leitores de tela. A linha de
referência (brand-800, tracejada) é o percentual do projeto. O card "Progresso por módulo" já entra no
painel nesta sprint, junto com os de progresso, fase e tarefas atrasadas.

### Sprint 3

**D25 — Onde ficam os impedimentos.**
A seção 11 não tem rota própria para impedimentos. Eles são do projeto e aparecem em dois lugares: no fim
da tela de Reuniões (todos, abertos e resolvidos) e na seção 5 de cada ata em rascunho, onde podem ser
abertos já vinculados à reunião (`reuniaoId`) e resolvidos.

**D26 — "Pontos críticos e impedimentos" da ata.**
A ata lista os impedimentos ABERTOS do projeto mais os registrados naquela reunião, mesmo que já
resolvidos. É esse conjunto que vai para o snapshot ao finalizar.

**D27 — Resolução de impedimento com no mínimo 10 caracteres.**
"Resolver com resolução" (Sprint 3) exige o texto da resolução, com o mesmo mínimo dos motivos. A
descrição do impedimento também tem mínimo de 10 caracteres.

**D28 — Tipo da reunião na criação.**
O botão "Nova reunião semanal" abre um diálogo com o tipo (Semanal, padrão, ou Kickoff) e a data já
preenchida com o próximo dia configurado (hoje, se hoje for o dia). A reunião de PRONTIDÃO é criada
automaticamente no avanço para HANDOVER (Sprint 7). Reuniões não são excluídas: a spec não prevê isso.

**D29 — Parte dos participantes.**
Membro da equipe entra como Contratada e pessoa do cliente como Contratante, automaticamente. Só o
participante sem cadastro (`nomeAvulso`) tem a parte escolhida. Repetidos são recusados.

**D30 — Ata finalizada lida só do snapshot.**
Depois de finalizada, a tela (e o PDF, na Sprint 4) usa exclusivamente `Reuniao.snapshot`. As tarefas
criadas na ata continuam editáveis em Tarefas, mas a ata mostra o conteúdo congelado. Todas as actions
que mexem na reunião (dados, participantes, decisões, ações e impedimentos vinculados) recusam ata
FINALIZADA no servidor. O seed monta os snapshots das reuniões 1 a 3 com a mesma `montarSnapshot` do app.
