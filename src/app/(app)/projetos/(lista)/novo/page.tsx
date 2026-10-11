import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { FormNovoProjeto } from "@/features/projetos/components/form-novo-projeto";
import { hojeISO } from "@/lib/formatos";

export const metadata: Metadata = { title: "Nova implantação" };

export default function PaginaNovoProjeto() {
  return (
    <div className="mx-auto max-w-2xl">
      <CabecalhoPagina
        titulo="Nova implantação"
        descricao="Abra o projeto a partir do handoff comercial. Você será o Líder."
      />
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <FormNovoProjeto hoje={hojeISO()} />
      </div>
    </div>
  );
}
