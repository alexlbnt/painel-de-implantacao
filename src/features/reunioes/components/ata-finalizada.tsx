import { BadgeParte } from "@/components/badge-status";
import {
  formatarData,
  formatarDataHora,
  LABEL_CATEGORIA_IMPEDIMENTO,
  LABEL_STATUS_IMPEDIMENTO,
  LABEL_STATUS_TAREFA,
  LABEL_TIPO_REUNIAO,
} from "@/lib/formatos";
import { rotuloDecisao, type SnapshotAta } from "@/lib/regras/reunioes";

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`fin-${numero}`}
      className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm"
    >
      <h2 id={`fin-${numero}`} className="mb-3 text-lg font-semibold">
        <span className="mr-2 text-brand-800">{numero}.</span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const Vazio = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left">
          <tr>
            {cabecalho.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {linhas.map((l, i) => (
            <tr key={i}>
              {l.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const statusLegivel = (s: string) =>
  (LABEL_STATUS_TAREFA as Record<string, string>)[s] ??
  (LABEL_STATUS_IMPEDIMENTO as Record<string, string>)[s] ??
  s;

/** Ata finalizada: mostra SOMENTE o snapshot congelado (RN08). */
export function AtaFinalizada({ s }: { s: SnapshotAta }) {
  const c = s.cabecalho;
  return (
    <div className="space-y-4">
      <Secao numero={1} titulo="Cabeçalho">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Ata</dt>
            <dd className="font-medium">
              nº {c.numero} · {LABEL_TIPO_REUNIAO[c.tipo]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Projeto</dt>
            <dd className="font-medium">{c.projeto.nome}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cliente</dt>
            <dd className="font-medium">
              {c.projeto.cliente} · {c.projeto.municipio}/{c.projeto.uf}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data e horário</dt>
            <dd className="font-medium">
              {formatarData(c.data)}
              {c.horaInicio ? ` · ${c.horaInicio}${c.horaFim ? `–${c.horaFim}` : ""}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Local</dt>
            <dd className="font-medium">{c.local ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Finalizada em</dt>
            <dd className="font-medium">{formatarDataHora(new Date(s.finalizadaEm))}</dd>
          </div>
        </dl>
      </Secao>

      <Secao numero={2} titulo="Participantes">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["contratada", "contratante"] as const).map((parte) => (
            <div key={parte}>
              <h3 className="mb-2">
                <BadgeParte parte={parte === "contratada" ? "CONTRATADA" : "CONTRATANTE"} />
              </h3>
              {s.participantes[parte].length === 0 ? (
                <Vazio>Ninguém registrado.</Vazio>
              ) : (
                <ul className="list-inside list-disc text-sm">
                  {s.participantes[parte].map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Secao>

      <Secao numero={3} titulo="Status do cronograma">
        <p className="text-sm">
          Percentual acumulado na data:{" "}
          <span className="text-2xl font-semibold">{s.percentualNoDia}%</span>
        </p>
        <p className="mt-2 text-sm whitespace-pre-line">
          {s.resumoStatus ?? "Sem resumo executivo."}
        </p>
      </Secao>

      <Secao numero={4} titulo="Ações da reunião anterior">
        {s.acoesAnteriores.reuniaoNumero === null ? (
          <Vazio>Primeira reunião do projeto.</Vazio>
        ) : s.acoesAnteriores.itens.length === 0 ? (
          <Vazio>A reunião nº {s.acoesAnteriores.reuniaoNumero} não registrou ações.</Vazio>
        ) : (
          <Tabela
            cabecalho={["Ação", "Responsável", "Prazo", "Status no momento"]}
            linhas={s.acoesAnteriores.itens.map((a) => [
              a.titulo,
              a.responsavel ?? "—",
              formatarData(a.prazo),
              statusLegivel(a.status),
            ])}
          />
        )}
      </Secao>

      <Secao numero={5} titulo="Pontos críticos e impedimentos">
        {s.impedimentos.length === 0 ? (
          <Vazio>Nenhum impedimento.</Vazio>
        ) : (
          <Tabela
            cabecalho={["Categoria", "Descrição", "Parte", "Aberto desde", "Status"]}
            linhas={s.impedimentos.map((i) => [
              (LABEL_CATEGORIA_IMPEDIMENTO as Record<string, string>)[i.categoria] ?? i.categoria,
              i.descricao,
              <BadgeParte key="p" parte={i.parteResponsavel} />,
              formatarData(i.abertoEm),
              statusLegivel(i.status),
            ])}
          />
        )}
      </Secao>

      <Secao numero={6} titulo="Decisões e realinhamentos">
        {s.decisoes.length === 0 ? (
          <Vazio>Nenhuma decisão registrada.</Vazio>
        ) : (
          <ol className="space-y-2 text-sm">
            {s.decisoes.map((d) => (
              <li key={d.numero}>
                <span className="font-semibold text-brand-800">{rotuloDecisao(d.numero)}: </span>
                <span className="whitespace-pre-line">{d.texto}</span>
              </li>
            ))}
          </ol>
        )}
      </Secao>

      <Secao numero={7} titulo="Plano de ação para a próxima semana">
        {s.planoAcao.length === 0 ? (
          <Vazio>Nenhuma ação.</Vazio>
        ) : (
          <Tabela
            cabecalho={["Tarefa", "Responsável", "Prazo", "Parte"]}
            linhas={s.planoAcao.map((a) => [
              a.titulo,
              a.responsavel ?? "—",
              formatarData(a.prazo),
              <BadgeParte key="p" parte={a.parteResponsavel} />,
            ])}
          />
        )}
      </Secao>

      <Secao numero={8} titulo="Observações gerais e salvaguardas">
        <p className="text-sm whitespace-pre-line">{s.salvaguardas ?? "Sem observações."}</p>
      </Secao>
    </div>
  );
}
