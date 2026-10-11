import { AppShell, type ItemNavegacao } from "@/components/app-shell";
import { APP_NAME } from "@/lib/constantes";
import { exigirSessao } from "@/server/permissoes";

const ITENS: ItemNavegacao[] = [
  { href: "/projetos", rotulo: "Meus projetos", icone: "projetos", exato: true },
  { href: "/projetos/novo", rotulo: "Nova implantação", icone: "fases", exato: true },
];

export default async function LayoutListaProjetos({ children }: LayoutProps<"/projetos">) {
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
