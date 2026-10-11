"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Progresso por módulo (seção 11/12): barras horizontais brand-500; referência (percentual do projeto)
// em brand-800; grade na cor "line". Uma série só: sem legenda, o título nomeia.
// brand-500 tem contraste < 3:1 com o branco, então as barras ganham contorno brand-700, rótulo
// de valor e uma tabela equivalente para leitores de tela.

const COR = {
  barra: "#a2bb40", // brand-500
  contorno: "#708226", // brand-700
  referencia: "#566321", // brand-800
  grade: "#e2e8f0", // line
  texto: "#0f172a", // ink
  textoSecundario: "#475569",
};

export type DadoModulo = { nome: string; percentual: number };

function Dica({ active, payload }: { active?: boolean; payload?: { payload: DadoModulo }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-ink">{d.nome}</p>
      <p className="text-muted-foreground">{d.percentual}% concluído</p>
    </div>
  );
}

export function GraficoModulos({
  dados,
  percentualProjeto,
  titulo = "Progresso por módulo",
}: {
  dados: DadoModulo[];
  percentualProjeto?: number;
  titulo?: string;
}) {
  if (dados.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado ainda.</p>;
  }
  const altura = Math.max(120, dados.length * 40 + 48);

  return (
    <figure className="w-full">
      <div aria-hidden className="w-full" style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            layout="vertical"
            margin={{ top: 20, right: 48, bottom: 4, left: 4 }}
            barCategoryGap={10}
          >
            <CartesianGrid horizontal={false} stroke={COR.grade} />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: COR.textoSecundario, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="nome"
              width={112}
              tick={{ fill: COR.texto, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
            />
            <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Dica />} />
            {percentualProjeto !== undefined ? (
              <ReferenceLine
                x={percentualProjeto}
                stroke={COR.referencia}
                strokeWidth={2}
                strokeDasharray="4 3"
                label={{
                  value: `Projeto ${percentualProjeto}%`,
                  position: "top",
                  fill: COR.referencia,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            ) : null}
            <Bar
              dataKey="percentual"
              fill={COR.barra}
              stroke={COR.contorno}
              strokeWidth={1}
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="percentual"
                position="right"
                formatter={(v: unknown) => `${v}%`}
                fill={COR.texto}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{titulo}</figcaption>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Módulo</th>
            <th scope="col">Percentual</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.nome}>
              <th scope="row">{d.nome}</th>
              <td>{d.percentual}%</td>
            </tr>
          ))}
          {percentualProjeto !== undefined ? (
            <tr>
              <th scope="row">Projeto (média ponderada)</th>
              <td>{percentualProjeto}%</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </figure>
  );
}
