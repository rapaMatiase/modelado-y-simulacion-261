"use client";

import { useState } from "react";
import { runModel } from "@/lib/pyodide-client";
import type {
  LineChartBlock,
  ModelDefinition,
  OutputBlock,
  ScalarBlock,
  TableBlock,
  ValueFormat,
} from "@/lib/models";

type SolveData = {
  series?: Array<Record<string, number>>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

type FormValues = Record<string, number | string>;

export function ModelRunner({ model }: { model: ModelDefinition }) {
  const initial: FormValues = Object.fromEntries(
    model.params.map((p) => [p.name, p.default]),
  );

  const [values, setValues] = useState<FormValues>(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState<string>("");
  const [data, setData] = useState<SolveData | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateNumber(name: string, raw: string) {
    const num = Number(raw);
    setValues((prev) => ({
      ...prev,
      [name]: Number.isFinite(num) ? num : 0,
    }));
  }

  function updateString(name: string, raw: string) {
    setValues((prev) => ({ ...prev, [name]: raw }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setData(null);
    setProgress("");

    try {
      const result = await runModel<SolveData>(model.slug, values, setProgress);
      setData(result);
      setStatus("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    } finally {
      setProgress("");
    }
  }

  return (
    <div className="runner">
      <section className="runner-input">
        <h3>Parámetros</h3>
        <form onSubmit={submit}>
          {model.params.map((p) => (
            <label key={p.name} className="field">
              <span>{p.label}</span>
              {p.type === "number" ? (
                <input
                  type="number"
                  value={values[p.name] as number}
                  step={p.step ?? "any"}
                  min={p.min}
                  max={p.max}
                  onChange={(e) => updateNumber(p.name, e.target.value)}
                  required
                />
              ) : (
                <input
                  type="text"
                  value={values[p.name] as string}
                  placeholder={p.placeholder}
                  onChange={(e) => updateString(p.name, e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  required
                />
              )}
              {p.description && <small>{p.description}</small>}
            </label>
          ))}
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Calculando…" : "Resolver"}
          </button>
        </form>
      </section>

      <section className="runner-output">
        <h3>Resultado</h3>
        {status === "idle" && (
          <p className="muted">Cargá los parámetros y ejecutá el modelo.</p>
        )}
        {status === "loading" && (
          <p className="muted">{progress || "Resolviendo…"}</p>
        )}
        {status === "error" && (
          <div className="error">
            <strong>Error al resolver el modelo</strong>
            <div>{error}</div>
          </div>
        )}
        {status === "ok" && data && (
          <OutputBlocks blocks={model.output} data={data} />
        )}
      </section>
    </div>
  );
}

function OutputBlocks({
  blocks,
  data,
}: {
  blocks: OutputBlock[];
  data: SolveData;
}) {
  const scalars = blocks.filter((b): b is ScalarBlock => b.kind === "scalar");
  const others = blocks.filter((b) => b.kind !== "scalar");

  return (
    <div className="output-blocks">
      {scalars.length > 0 && (
        <div className="scalar-row">
          {scalars.map((b, i) => (
            <ScalarView key={i} block={b} data={data} />
          ))}
        </div>
      )}
      {others.map((b, i) => {
        if (b.kind === "line-chart") return <LineChart key={i} block={b} data={data} />;
        if (b.kind === "table") return <DataTable key={i} block={b} data={data} />;
        return null;
      })}
    </div>
  );
}

function ScalarView({ block, data }: { block: ScalarBlock; data: SolveData }) {
  const value = data.metadata?.[block.metadataKey];
  return (
    <div className="scalar-card">
      <span className="scalar-label">{block.label}</span>
      <span className="scalar-value">{formatValue(value, block.format)}</span>
    </div>
  );
}

function DataTable({ block, data }: { block: TableBlock; data: SolveData }) {
  const raw = data[block.dataKey];
  if (!Array.isArray(raw) || raw.length === 0) {
    return <p className="muted">Sin datos para la tabla.</p>;
  }
  const rows = raw as Array<Record<string, unknown>>;
  return (
    <div>
      {block.title && <h4 className="block-title">{block.title}</h4>}
      <div className="table-wrap">
        <table className="iter-table">
          <thead>
            <tr>
              {block.columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {block.columns.map((c) => (
                  <td key={c.key}>{formatValue(row[c.key], c.format)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LineChart({ block, data }: { block: LineChartBlock; data: SolveData }) {
  const series = data.series ?? [];
  if (series.length === 0) {
    return <p className="muted">Sin datos para graficar.</p>;
  }

  const W = 640;
  const H = 320;
  const PAD = 48;

  const xs = series.map((s) => Number(s[block.xKey] ?? 0));
  const ys = series.map((s) => Number(s[block.yKey] ?? 0));
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(0, ...ys);

  const sx = (v: number) =>
    PAD + ((v - xMin) / (xMax - xMin || 1)) * (W - 2 * PAD);
  const sy = (v: number) =>
    H - PAD - ((v - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);

  const path = series
    .map(
      (s, i) =>
        `${i === 0 ? "M" : "L"} ${sx(Number(s[block.xKey] ?? 0))} ${sy(Number(s[block.yKey] ?? 0))}`,
    )
    .join(" ");

  const ticks = 5;
  const xTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    xMin + ((xMax - xMin) * i) / ticks,
  );
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    yMin + ((yMax - yMin) * i) / ticks,
  );

  const showZero = yMin < 0 && yMax > 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Gráfica">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#475569" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#475569" />
      {xTicks.map((t, i) => (
        <g key={`x-${i}`}>
          <line x1={sx(t)} y1={H - PAD} x2={sx(t)} y2={H - PAD + 4} stroke="#475569" />
          <text x={sx(t)} y={H - PAD + 18} fontSize={11} fill="#94a3b8" textAnchor="middle">
            {formatTick(t)}
          </text>
        </g>
      ))}
      {yTicks.map((t, i) => (
        <g key={`y-${i}`}>
          <line x1={PAD - 4} y1={sy(t)} x2={PAD} y2={sy(t)} stroke="#475569" />
          <text x={PAD - 8} y={sy(t) + 4} fontSize={11} fill="#94a3b8" textAnchor="end">
            {formatTick(t)}
          </text>
        </g>
      ))}
      {showZero && (
        <line
          x1={PAD}
          x2={W - PAD}
          y1={sy(0)}
          y2={sy(0)}
          stroke="#94a3b8"
          strokeDasharray="4 4"
        />
      )}
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} />
      <text x={W / 2} y={H - 10} textAnchor="middle" fontSize={12} fill="#cbd5e1">
        {block.xLabel}
      </text>
      <text
        x={14}
        y={H / 2}
        transform={`rotate(-90, 14, ${H / 2})`}
        textAnchor="middle"
        fontSize={12}
        fill="#cbd5e1"
      >
        {block.yLabel}
      </text>
    </svg>
  );
}

function formatValue(v: unknown, format?: ValueFormat): string {
  if (v === null || v === undefined) return "—";
  if (format === "boolean") return v ? "Sí" : "No";
  if (format === "string") return String(v);
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (format === "integer") return Math.trunc(n).toString();
  if (format === "scientific") return n.toExponential(4);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 10000 || abs < 0.001)) return n.toExponential(4);
  return Number(n.toFixed(6)).toString();
}

function formatTick(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs !== 0 && (abs >= 1000 || abs < 0.01)) return v.toExponential(1);
  return Number(v.toFixed(2)).toString();
}
