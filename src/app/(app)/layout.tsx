import { AppShell, type ItemNavegacao } from "@/components/app-shell";
import { APP_NAME } from "@/lib/constantes";
import { exigirSessao } from "@/server/permissoes";

const ITENS: ItemNavegacao[] = [{ href: "/projetos", rotulo: "Meus projetos", icone: "projetos" }];

// Exige sessão (checada no servidor). Sem sessão: redireciona para /login.
export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const usuario = await exigirSessao();
  return (
    <AppShell
      appNome={APP_NAME}
      usuario={{ nome: usuario.nome, email: usuario.email }}
      itens={ITENS}
    >
      {children}
    </AppShell>
  );
}
