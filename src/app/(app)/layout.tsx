import { exigirSessao } from "@/server/permissoes";

// Área autenticada: exige sessão (checada no servidor). Sem sessão: redireciona para /login.
// O shell (barra lateral) fica nos layouts filhos: lista de projetos e projeto.
export default async function LayoutApp({ children }: LayoutProps<"/">) {
  await exigirSessao();
  return children;
}
