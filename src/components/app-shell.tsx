"use client";

import { FolderKanban, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sair } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

// Shell autenticado (seção 12): barra lateral brand-500 com texto brand-950,
// item ativo brand-600 e borda direita 2px brand-600. No celular, barra superior
// brand-500 com menu em gaveta. Nunca texto branco sobre o verde.

/** Ícones disponíveis para a navegação (Server Components passam só o nome). */
const ICONES = {
  projetos: FolderKanban,
} as const;

export type IconeNavegacao = keyof typeof ICONES;

export type ItemNavegacao = {
  href: string;
  rotulo: string;
  icone: IconeNavegacao;
  /** Ativo só quando o caminho é exatamente o href. */
  exato?: boolean;
};

type Props = {
  appNome: string;
  usuario: { nome: string; email: string };
  itens: ItemNavegacao[];
  children: ReactNode;
};

const focoNoVerde =
  "outline-none focus-visible:ring-2 focus-visible:ring-brand-950 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500";

function estaAtivo(item: ItemNavegacao, caminho: string) {
  return item.exato
    ? caminho === item.href
    : caminho === item.href || caminho.startsWith(`${item.href}/`);
}

function Navegacao({ itens, aoNavegar }: { itens: ItemNavegacao[]; aoNavegar?: () => void }) {
  const caminho = usePathname();
  return (
    <nav aria-label="Navegação principal">
      <ul className="space-y-1">
        {itens.map((item) => {
          const Icone = ICONES[item.icone];
          const ativo = estaAtivo(item, caminho);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={aoNavegar}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-950 transition-colors hover:bg-brand-600",
                  ativo && "bg-brand-600 font-semibold",
                  focoNoVerde,
                )}
              >
                <Icone className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function BlocoUsuario({ usuario }: { usuario: Props["usuario"] }) {
  return (
    <div className="space-y-2 border-t-2 border-brand-600 pt-4">
      <div className="min-w-0 px-3 text-brand-950">
        <p className="truncate text-sm font-semibold">{usuario.nome}</p>
        <p className="truncate text-xs">{usuario.email}</p>
      </div>
      <form action={sair}>
        <button
          type="submit"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-950 transition-colors hover:bg-brand-600",
            focoNoVerde,
          )}
        >
          <LogOut className="size-4" aria-hidden />
          Sair
        </button>
      </form>
    </div>
  );
}

export function AppShell({ appNome, usuario, itens, children }: Props) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop: barra lateral fixa */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r-2 border-brand-600 bg-brand-500 p-4 lg:flex">
        <Link
          href="/projetos"
          className={cn("rounded-lg px-3 py-1 text-xl font-semibold text-brand-950", focoNoVerde)}
        >
          {appNome}
        </Link>
        <div className="flex-1 overflow-y-auto">
          <Navegacao itens={itens} />
        </div>
        <BlocoUsuario usuario={usuario} />
      </aside>

      {/* Celular: barra superior com menu em gaveta */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b-2 border-brand-600 bg-brand-500 px-2 lg:hidden">
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("text-brand-950 hover:bg-brand-600 hover:text-brand-950", focoNoVerde)}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 gap-6 border-r-2 border-brand-600 bg-brand-500 p-4 text-brand-950 [&_[data-slot=sheet-close]]:text-brand-950 [&_[data-slot=sheet-close]]:hover:bg-brand-600"
          >
            <div>
              <SheetTitle className="px-3 text-xl font-semibold text-brand-950">
                {appNome}
              </SheetTitle>
              <SheetDescription className="sr-only">Menu de navegação</SheetDescription>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Navegacao itens={itens} aoNavegar={() => setMenuAberto(false)} />
            </div>
            <BlocoUsuario usuario={usuario} />
          </SheetContent>
        </Sheet>
        <Link
          href="/projetos"
          className={cn("rounded-lg px-1 text-lg font-semibold text-brand-950", focoNoVerde)}
        >
          {appNome}
        </Link>
      </header>

      <main className="min-w-0 flex-1 bg-canvas">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
