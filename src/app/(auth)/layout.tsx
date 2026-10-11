import { redirect } from "next/navigation";
import { APP_FRASE, APP_NAME, ORG_NAME } from "@/lib/constantes";
import { obterSessao } from "@/server/permissoes";

// Layout dividido (seção 11): painel verde à esquerda com nome e frase; formulário à direita.
// No celular: só o formulário, com faixa verde no topo. Texto sobre o verde = brand-950.
// Quem já está logado vai para /projetos. A checagem fica no layout (fora do loading.tsx)
// para responder 307 antes do streaming, sem piscar o skeleton.
export default async function LayoutAutenticacao({ children }: LayoutProps<"/">) {
  if (await obterSessao()) redirect("/projetos");

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="bg-brand-500 text-brand-950 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:border-r-2 lg:border-brand-600 lg:p-12">
        <div className="px-4 py-4 lg:p-0">
          <p className="text-xl font-semibold tracking-tight lg:text-3xl">{APP_NAME}</p>
          <p className="hidden text-sm lg:mt-1 lg:block">Painel de Implantação de Sistemas</p>
        </div>
        <div className="hidden max-w-md lg:block">
          <p className="text-3xl leading-tight font-semibold">{APP_FRASE}</p>
          <p className="mt-4 text-base">
            Fase, pendências, atas e evidências com autor e data. Em 10 segundos você sabe o que
            está travado e o que falta para entregar.
          </p>
        </div>
        <p className="hidden text-sm lg:block">{ORG_NAME}</p>
      </aside>
      <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
