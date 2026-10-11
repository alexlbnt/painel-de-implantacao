import { AppShell } from "@/components/app-shell";
import { navegacaoDoProjeto } from "@/features/projetos/navegacao";
import { obterProjeto } from "@/features/projetos/queries";
import { APP_NAME } from "@/lib/constantes";
import { exigirMembro } from "@/server/permissoes";

// Exige membro do projeto: não membro recebe 404 (seção 3), não 403.
export default async function LayoutProjeto({ children, params }: LayoutProps<"/projetos/[id]">) {
  const { id } = await params;
  const { usuario } = await exigirMembro(id);
  const projeto = await obterProjeto(id);
  return (
    <AppShell
      appNome={APP_NAME}
      usuario={{ nome: usuario.nome, email: usuario.email }}
      itens={navegacaoDoProjeto(id)}
      contexto={{ titulo: projeto.nome, subtitulo: `${projeto.municipio}/${projeto.uf}` }}
    >
      {children}
    </AppShell>
  );
}
