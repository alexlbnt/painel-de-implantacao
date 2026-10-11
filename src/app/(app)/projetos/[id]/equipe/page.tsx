import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { GerenciarEquipe } from "@/features/equipe/components/gerenciar-equipe";
import { prisma } from "@/server/db";
import { ehLider, exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Equipe" };

export default async function PaginaEquipe({ params }: PageProps<"/projetos/[id]/equipe">) {
  const { id } = await params;
  const { usuario, membro } = await exigirMembro(id);
  const membros = await prisma.membroProjeto.findMany({
    where: { projetoId: id },
    select: { id: true, papel: true, usuario: { select: { id: true, nome: true, email: true } } },
    orderBy: [{ papel: "asc" }, { usuario: { nome: "asc" } }],
  });

  return (
    <>
      <CabecalhoPagina
        titulo="Equipe"
        descricao="Membros da contratada neste projeto. Papéis valem só para este projeto."
      />
      <GerenciarEquipe
        projetoId={id}
        podeGerenciar={ehLider(membro)}
        membros={membros.map((m) => ({
          id: m.id,
          papel: m.papel,
          nome: m.usuario.nome,
          email: m.usuario.email,
          ehVoce: m.usuario.id === usuario.id,
        }))}
      />
    </>
  );
}
