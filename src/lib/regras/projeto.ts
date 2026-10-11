// Regras do cadastro do projeto (seção 3).

/** Excluir projeto: só em PLANEJAMENTO, confirmando com o nome exato do projeto. */
export function validarExclusaoProjeto(
  fase: string,
  nomeProjeto: string,
  confirmacao: string,
): string | null {
  if (fase !== "PLANEJAMENTO") {
    return "Só é possível excluir um projeto que ainda está em Planejamento.";
  }
  if (confirmacao.trim() !== nomeProjeto.trim()) {
    return "Digite o nome do projeto exatamente como aparece para confirmar.";
  }
  return null;
}

/** Normaliza a lista de departamentos iniciais: remove vazios e repetidos (sem diferenciar maiúsculas). */
export function normalizarDepartamentos(nomes: readonly string[]): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const bruto of nomes) {
    const nome = bruto.trim().replace(/\s+/g, " ");
    const chave = nome.toLocaleLowerCase("pt-BR");
    if (!nome || vistos.has(chave)) continue;
    vistos.add(chave);
    resultado.push(nome);
  }
  return resultado;
}
