export type NumberParam = {
  name: string;
  label: string;
  type: "number";
  default: number;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
};

export type StringParam = {
  name: string;
  label: string;
  type: "string";
  default: string;
  placeholder?: string;
  description?: string;
};

export type ModelParam = NumberParam | StringParam;

export type ValueFormat =
  | "number"
  | "scientific"
  | "integer"
  | "boolean"
  | "string";

export type LineChartBlock = {
  kind: "line-chart";
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
};

export type TableBlock = {
  kind: "table";
  title?: string;
  dataKey: string;
  columns: Array<{ key: string; label: string; format?: ValueFormat }>;
};

export type ScalarBlock = {
  kind: "scalar";
  metadataKey: string;
  label: string;
  format?: ValueFormat;
};

export type OutputBlock = LineChartBlock | TableBlock | ScalarBlock;

export type ModelDefinition = {
  slug: string;
  name: string;
  description: string;
  params: ModelParam[];
  output: OutputBlock[];
};

export const MODELS: ModelDefinition[] = [
  {
    slug: "logistic-growth",
    name: "Crecimiento Logístico",
    description:
      "Resuelve dx/dt = r·x·(1 − x/K). Modelo de crecimiento poblacional con capacidad de carga.",
    params: [
      {
        name: "r",
        label: "Tasa de crecimiento (r)",
        type: "number",
        default: 0.4,
        min: 0.0001,
        step: 0.01,
        description: "Velocidad intrínseca de crecimiento.",
      },
      {
        name: "K",
        label: "Capacidad de carga (K)",
        type: "number",
        default: 100,
        min: 1,
        step: 1,
        description: "Valor asintótico de la población.",
      },
      {
        name: "x0",
        label: "Población inicial (x₀)",
        type: "number",
        default: 2,
        min: 0.0001,
        step: 0.1,
        description: "Estado inicial en t = 0.",
      },
    ],
    output: [
      {
        kind: "line-chart",
        xKey: "t",
        yKey: "x",
        xLabel: "Tiempo",
        yLabel: "Población",
      },
    ],
  },

  {
    slug: "bisection",
    name: "Búsqueda binaria (Bisección)",
    description:
      "Encuentra una raíz de f(x) = 0 en el intervalo [a, b] mediante búsqueda binaria, validando previamente el teorema de Bolzano.",
    params: [
      {
        name: "expression",
        label: "Función f(x)",
        type: "string",
        default: "x**3 - x - 2",
        placeholder: "Ej: x**3 - x - 2",
        description:
          "Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      {
        name: "a",
        label: "Extremo izquierdo (a)",
        type: "number",
        default: 1,
        step: 0.0001,
      },
      {
        name: "b",
        label: "Extremo derecho (b)",
        type: "number",
        default: 2,
        step: 0.0001,
      },
      {
        name: "tolerance",
        label: "Tolerancia (ε)",
        type: "number",
        default: 1e-6,
        min: 1e-15,
        step: 1e-6,
        description: "Criterio de parada: |f(c)| < ε o |b−a|/2 < ε.",
      },
      {
        name: "max_iter",
        label: "Iteraciones máximas",
        type: "number",
        default: 100,
        min: 1,
        max: 1000,
        step: 1,
      },
    ],
    output: [
      {
        kind: "scalar",
        metadataKey: "root",
        label: "Raíz aproximada",
        format: "number",
      },
      {
        kind: "scalar",
        metadataKey: "f_root",
        label: "f(raíz)",
        format: "scientific",
      },
      {
        kind: "scalar",
        metadataKey: "iterations",
        label: "Iteraciones",
        format: "integer",
      },
      {
        kind: "scalar",
        metadataKey: "converged",
        label: "Convergió",
        format: "boolean",
      },
      {
        kind: "line-chart",
        xKey: "x",
        yKey: "y",
        xLabel: "x",
        yLabel: "f(x)",
      },
      {
        kind: "table",
        title: "Iteraciones",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "a", label: "a", format: "number" },
          { key: "b", label: "b", format: "number" },
          { key: "c", label: "c", format: "number" },
          { key: "f_a", label: "f(a)", format: "scientific" },
          { key: "f_b", label: "f(b)", format: "scientific" },
          { key: "f_c", label: "f(c)", format: "scientific" },
          { key: "error", label: "error", format: "scientific" },
        ],
      },
    ],
  },
];

export function getModel(slug: string): ModelDefinition | undefined {
  return MODELS.find((m) => m.slug === slug);
}
