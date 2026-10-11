import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { CardProjeto } from "@/features/projetos/components/card-projeto";
import { listarProjetosDoUsuario } from "@/features/projetos/queries";
import { exigirSessao } from "@/server/permissoes";

export const metadata: Metadata = { title: "Meus projetos" };

export default async function PaginaProjetos() {
  const usuario = await exigirSessao();
  const projetos = await listarProjetosDoUsuario(usuario.id);

  const novo = (
    <Button asChild>
      <Link href="/projetos/novo">
        <Plus aria-hidden />
        Nova implantação
      </Link>
    </Button>
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Meus projetos"
        descricao="Implantações das quais você participa."
        acoes={projetos.length > 0 ? novo : undefined}
      />
      {projetos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma implantação por aqui ainda"
          descricao="Abra a primeira implantação a partir do handoff comercial, ou peça a um Líder para adicionar você a uma equipe."
          acao={novo}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => (
            <li key={p.id}>
              <CardProjeto projeto={p} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
