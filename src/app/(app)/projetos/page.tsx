import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";

export const metadata: Metadata = { title: "Meus projetos" };

// Sprint 0: shell autenticado. Lista de projetos e "Nova implantação" chegam na Sprint 1.
export default function PaginaProjetos() {
  return (
    <>
      <CabecalhoPagina titulo="Meus projetos" descricao="Implantações das quais você participa." />
      <EstadoVazio
        titulo="Nenhuma implantação por aqui ainda"
        descricao="Quando você abrir uma implantação ou for adicionado a uma equipe, ela aparece nesta lista."
      />
    </>
  );
}
