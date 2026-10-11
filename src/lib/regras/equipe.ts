// Regras da equipe do projeto (seção 3): o último Líder não pode ser removido nem rebaixado.

export type PapelEquipe = "LIDER" | "ANALISTA";
export type MembroEquipe = { id: string; papel: PapelEquipe };

const ULTIMO_LIDER = "O projeto precisa de pelo menos um Líder. Promova outro membro antes.";

function ehUltimoLider(membros: readonly MembroEquipe[], alvo: MembroEquipe): boolean {
  return alvo.papel === "LIDER" && membros.filter((m) => m.papel === "LIDER").length <= 1;
}

export function validarRemocaoMembro(
  membros: readonly MembroEquipe[],
  alvoId: string,
): string | null {
  const alvo = membros.find((m) => m.id === alvoId);
  if (!alvo) return "Membro não encontrado.";
  return ehUltimoLider(membros, alvo) ? ULTIMO_LIDER : null;
}

export function validarMudancaPapel(
  membros: readonly MembroEquipe[],
  alvoId: string,
  novoPapel: PapelEquipe,
): string | null {
  const alvo = membros.find((m) => m.id === alvoId);
  if (!alvo) return "Membro não encontrado.";
  if (alvo.papel === novoPapel) return null;
  return novoPapel === "ANALISTA" && ehUltimoLider(membros, alvo) ? ULTIMO_LIDER : null;
}
