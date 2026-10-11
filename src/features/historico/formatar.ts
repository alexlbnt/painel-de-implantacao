import {
  formatarData,
  formatarDataHora,
  LABEL_CANAL,
  LABEL_CATEGORIA_IMPEDIMENTO,
  LABEL_CATEGORIA_NOTA,
  LABEL_CRITERIO,
  LABEL_ESTRATEGIA_RISCO,
  LABEL_FASE,
  LABEL_PAPEL,
  LABEL_PARTE,
  LABEL_PRIORIDADE,
  LABEL_STATUS_ASSINATURA,
  LABEL_STATUS_MIGRACAO,
  LABEL_STATUS_MODULO,
  LABEL_STATUS_PROJETO,
  LABEL_STATUS_REUNIAO,
  LABEL_STATUS_TAREFA,
  LABEL_TIPO_EVIDENCIA,
  LABEL_TIPO_REUNIAO,
} from "@/lib/formatos";

// Exibição legível dos valores gravados no histórico (JSON: string, número, booleano ou nulo).

const ENUMS: Record<string, string> = Object.assign(
  {},
  LABEL_TIPO_REUNIAO,
  LABEL_TIPO_EVIDENCIA,
  LABEL_CANAL,
  LABEL_CATEGORIA_IMPEDIMENTO,
  LABEL_CATEGORIA_NOTA,
  LABEL_CRITERIO,
  LABEL_ESTRATEGIA_RISCO,
  LABEL_PRIORIDADE,
  LABEL_PARTE,
  LABEL_STATUS_MODULO,
  LABEL_STATUS_MIGRACAO,
  LABEL_STATUS_TAREFA,
  LABEL_STATUS_REUNIAO,
  LABEL_STATUS_ASSINATURA,
  LABEL_STATUS_PROJETO,
  LABEL_PAPEL,
  LABEL_FASE,
);

const NOMES_CAMPOS: Record<string, string> = {
  fase: "Fase",
  status: "Status",
  nome: "Nome",
  cliente: "Cliente",
  municipio: "Município",
  uf: "UF",
  handoffEm: "Handoff",
  inicioPrevisto: "Início previsto",
  fimPrevisto: "Fim previsto",
  diaReuniao: "Dia da reunião",
  cargo: "Cargo",
  departamento: "Departamento",
  email: "E-mail",
  telefone: "Telefone",
};

export function nomeDoCampo(campo: string | null): string | null {
  if (!campo) return null;
  return NOMES_CAMPOS[campo] ?? campo;
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function formatarValorHistorico(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number") return String(valor);
  if (typeof valor === "string") {
    if (ENUMS[valor]) return ENUMS[valor];
    if (DATA.test(valor)) return formatarData(valor);
    if (INSTANTE.test(valor)) {
      // Colunas @db.Date chegam como meia-noite UTC: mostrar só a data.
      return valor.includes("T00:00:00.000Z")
        ? formatarData(valor)
        : formatarDataHora(new Date(valor));
    }
    return valor;
  }
  return JSON.stringify(valor);
}
