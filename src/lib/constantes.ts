// Constantes do app. Nomes vêm de variáveis de ambiente para trocar sem caçar textos (seção 2).
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Marco";
export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || "Sua Empresa";
export const APP_FRASE = "Do handoff ao suporte: a implantação inteira em um só lugar.";

/** Fuso usado para exibir datas e para definir "hoje" nas regras (seção 6). */
export const FUSO_HORARIO = "America/Sao_Paulo";

export const SENHA_MIN = 8;
