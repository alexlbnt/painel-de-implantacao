import type { IconeNavegacao, ItemNavegacao } from "@/components/app-shell";

// Navegação do projeto, na ordem da seção 11. Cada aba entra na lista quando a sprint dela fica pronta.
const ABAS: { aba: string; rotulo: string; icone: IconeNavegacao }[] = [
  { aba: "", rotulo: "Painel", icone: "painel" },
  { aba: "fases", rotulo: "Ciclo de vida", icone: "fases" },
  { aba: "pessoas", rotulo: "Pessoas do cliente", icone: "pessoas" },
  { aba: "equipe", rotulo: "Equipe", icone: "equipe" },
  { aba: "historico", rotulo: "Histórico", icone: "historico" },
  { aba: "configuracoes", rotulo: "Configurações", icone: "configuracoes" },
];

export function navegacaoDoProjeto(projetoId: string): ItemNavegacao[] {
  const base = `/projetos/${projetoId}`;
  return [
    { href: "/projetos", rotulo: "Meus projetos", icone: "voltar", exato: true },
    ...ABAS.map(({ aba, rotulo, icone }) => ({
      href: aba ? `${base}/${aba}` : base,
      rotulo,
      icone,
      exato: aba === "",
    })),
  ];
}

/** A aba já existe? Usado para só criar links para telas prontas. */
export function abaDisponivel(aba: string): boolean {
  return aba === "fases" || ABAS.some((a) => a.aba === aba);
}
