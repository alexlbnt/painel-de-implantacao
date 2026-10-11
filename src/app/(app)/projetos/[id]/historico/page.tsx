import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ListaHistorico } from "@/features/historico/components/lista-historico";
import {
  LIMITE_HISTORICO,
  listarHistorico,
  opcoesFiltroHistorico,
} from "@/features/historico/queries";
import { LABEL_ENTIDADE } from "@/lib/formatos";
import { exigirMembro } from "@/server/permissoes";

export const metadata: Metadata = { title: "Histórico" };

export default async function PaginaHistorico({
  params,
  searchParams,
}: PageProps<"/projetos/[id]/historico">) {
  const { id } = await params;
  await exigirMembro(id);
  const sp = await searchParams;
  const entidade = typeof sp.entidade === "string" ? sp.entidade : "";
  const autor = typeof sp.autor === "string" ? sp.autor : "";

  const [entradas, opcoes] = await Promise.all([
    listarHistorico(id, { entidade, autorId: autor }),
    opcoesFiltroHistorico(id),
  ]);
  const filtrando = Boolean(entidade || autor);

  return (
    <>
      <CabecalhoPagina
        titulo="Histórico"
        descricao="Tudo o que mudou no projeto, com autor, data, valor anterior e novo."
      />

      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor="filtro-entidade" className="text-sm font-medium">
            O que mudou
          </label>
          <NativeSelect id="filtro-entidade" name="entidade" defaultValue={entidade}>
            <NativeSelectOption value="">Tudo</NativeSelectOption>
            {opcoes.entidades.map((e) => (
              <NativeSelectOption key={e} value={e}>
                {LABEL_ENTIDADE[e] ?? e}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="filtro-autor" className="text-sm font-medium">
            Autor
          </label>
          <NativeSelect id="filtro-autor" name="autor" defaultValue={autor}>
            <NativeSelectOption value="">Todos</NativeSelectOption>
            {opcoes.autores.map((a) => (
              <NativeSelectOption key={a.id} value={a.id}>
                {a.nome}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit">Filtrar</Button>
        {filtrando ? (
          <Button asChild variant="secondary">
            <Link href={`/projetos/${id}/historico`}>Limpar</Link>
          </Button>
        ) : null}
      </form>

      {entradas.length === 0 ? (
        <EstadoVazio
          titulo={
            filtrando ? "Nada encontrado com esses filtros" : "Nenhuma alteração registrada ainda"
          }
          descricao={
            filtrando
              ? "Tente outro filtro ou limpe a busca."
              : "Cada mudança feita no projeto aparece aqui, com autor e data."
          }
        />
      ) : (
        <>
          <ListaHistorico entradas={entradas} />
          {entradas.length === LIMITE_HISTORICO ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Mostrando as {LIMITE_HISTORICO} alterações mais recentes. Use os filtros para refinar.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
