import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaDepartamentos } from "@/features/pessoas/components/lista-departamentos";
import { TabelaPessoas } from "@/features/pessoas/components/tabela-pessoas";
import { prisma } from "@/server/db";
import { exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Pessoas do cliente" };

export default async function PaginaPessoas({ params }: PageProps<"/projetos/[id]/pessoas">) {
  const { id } = await params;
  await exigirMembro(id);
  const [pessoas, departamentos] = await Promise.all([
    prisma.pessoaCliente.findMany({
      where: { projetoId: id },
      include: { departamento: { select: { nome: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.departamento.findMany({
      where: { projetoId: id },
      select: { id: true, nome: true, _count: { select: { pessoas: true } } },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <>
      <CabecalhoPagina
        titulo="Pessoas do cliente"
        descricao="Quem participa da implantação do lado do cliente, organizado por departamento."
      />
      <Tabs defaultValue="pessoas">
        <TabsList>
          <TabsTrigger value="pessoas">Pessoas ({pessoas.length})</TabsTrigger>
          <TabsTrigger value="departamentos">Departamentos ({departamentos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pessoas" className="mt-4">
          <TabelaPessoas
            projetoId={id}
            departamentos={departamentos.map((d) => ({ id: d.id, nome: d.nome }))}
            pessoas={pessoas.map((p) => ({
              id: p.id,
              nome: p.nome,
              cargo: p.cargo,
              departamentoId: p.departamentoId,
              departamento: p.departamento?.nome ?? null,
              email: p.email,
              telefone: p.telefone,
            }))}
          />
        </TabsContent>
        <TabsContent value="departamentos" className="mt-4">
          <ListaDepartamentos
            projetoId={id}
            departamentos={departamentos.map((d) => ({
              id: d.id,
              nome: d.nome,
              pessoas: d._count.pessoas,
            }))}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
