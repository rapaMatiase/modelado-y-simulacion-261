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
          { key: "decision", label: "decisión", format: "string" },
        ],
      },
    ],
  },

  {
    slug: "fixed-point",
    name: "Punto Fijo",
    description:
      "Encuentra una raíz iterando xₙ₊₁ = g(xₙ) a partir de un valor inicial. Requiere reescribir f(x) = 0 como x = g(x).",
    params: [
      {
        name: "expression",
        label: "Función g(x)",
        type: "string",
        default: "cos(x) + x",
        placeholder: "Ej: cos(x) + x",
        description:
          "Forma despejada x = g(x). Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      {
        name: "x0",
        label: "Valor inicial (x₀)",
        type: "number",
        default: 1,
        step: 0.1,
        description: "Punto de partida cercano a la raíz sospechada.",
      },
      {
        name: "tolerance",
        label: "Tolerancia (ε)",
        type: "number",
        default: 1e-6,
        min: 1e-15,
        step: 1e-6,
        description: "Criterio: |xₙ₊₁ − xₙ| < ε.",
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
        kind: "scalar",
        metadataKey: "g_prime_abs",
        label: "|g'(raíz)|",
        format: "scientific",
      },
      {
        kind: "line-chart",
        xKey: "i",
        yKey: "x",
        xLabel: "Iteración n",
        yLabel: "xₙ",
      },
      {
        kind: "table",
        title: "Iteraciones",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x_prev", label: "xₙ", format: "number" },
          { key: "x_new", label: "xₙ₊₁ = g(xₙ)", format: "number" },
          { key: "abs_error", label: "|Δx|", format: "scientific" },
          { key: "rel_error", label: "|Δx|/|xₙ₊₁|", format: "scientific" },
        ],
      },
    ],
  },

  {
    slug: "newton-raphson",
    name: "Newton-Raphson",
    description:
      "Encuentra una raíz de f(x) = 0 mediante aproximaciones por la tangente: xₙ₊₁ = xₙ − f(xₙ)/f'(xₙ).",
    params: [
      {
        name: "expression",
        label: "Función f(x)",
        type: "string",
        default: "x**3 - x - 4",
        placeholder: "Ej: x**3 - x - 4",
        description:
          "Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e. La derivada se calcula numéricamente.",
      },
      {
        name: "x0",
        label: "Valor inicial (x₀)",
        type: "number",
        default: 1,
        step: 0.1,
        description: "Cuanto más cerca de la raíz, más rápido converge.",
      },
      {
        name: "tolerance",
        label: "Tolerancia (ε)",
        type: "number",
        default: 1e-6,
        min: 1e-15,
        step: 1e-6,
        description: "Criterio: |xₙ₊₁ − xₙ| < ε.",
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
          { key: "x_prev", label: "xₙ", format: "number" },
          { key: "f_x", label: "f(xₙ)", format: "scientific" },
          { key: "df_x", label: "f'(xₙ)", format: "scientific" },
          { key: "x_new", label: "xₙ₊₁", format: "number" },
          { key: "abs_error", label: "|Δx|", format: "scientific" },
        ],
      },
    ],
  },
];

export function getModel(slug: string): ModelDefinition | undefined {
  return MODELS.find((m) => m.slug === slug);
}
