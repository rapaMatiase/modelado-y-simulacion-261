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

  {
    slug: "aitken",
    name: "Aitken Δ²",
    description:
      "Acelera una iteración de punto fijo aplicando el salto predictivo de Aitken cada tres evaluaciones de g(x).",
    params: [
      {
        name: "expression",
        label: "Función g(x)",
        type: "string",
        default: "sqrt(2*x - 1)",
        placeholder: "Ej: sqrt(2*x - 1)",
        description:
          "Forma despejada x = g(x). Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      {
        name: "x0",
        label: "Valor inicial (x₀)",
        type: "number",
        default: 2,
        step: 0.1,
      },
      {
        name: "tolerance",
        label: "Tolerancia (ε)",
        type: "number",
        default: 1e-6,
        min: 1e-15,
        step: 1e-6,
        description: "Criterio: |x̂ − xₙ| < ε.",
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
      { kind: "scalar", metadataKey: "expression", label: "Función g(x)", format: "string" },
      { kind: "scalar", metadataKey: "root", label: "Raíz acelerada (x*)", format: "number" },
      { kind: "scalar", metadataKey: "g_root", label: "g(x*)", format: "number" },
      { kind: "scalar", metadataKey: "g_root_diff", label: "|g(x*) − x*|", format: "scientific" },
      { kind: "scalar", metadataKey: "iterations", label: "Iter. Aitken", format: "integer" },
      { kind: "scalar", metadataKey: "iterations_simple", label: "Iter. punto fijo simple", format: "integer" },
      { kind: "scalar", metadataKey: "comparison", label: "Comparación", format: "string" },
      { kind: "scalar", metadataKey: "converged", label: "Convergió", format: "boolean" },
      { kind: "line-chart", xKey: "i", yKey: "x", xLabel: "Iteración n", yLabel: "x̂ₙ" },
      {
        kind: "table",
        title: "Iteraciones de Aitken",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x_n", label: "xₙ", format: "number" },
          { key: "x_n1", label: "x₁ = g(xₙ)", format: "number" },
          { key: "x_n2", label: "x₂ = g(x₁)", format: "number" },
          { key: "denominador", label: "x₂ − 2x₁ + xₙ", format: "scientific" },
          { key: "x_hat", label: "x* acelerado", format: "number" },
          { key: "error", label: "error", format: "scientific" },
          { key: "nota", label: "nota", format: "string" },
        ],
      },
      {
        kind: "table",
        title: "Punto fijo simple (sin acelerar) — para comparación",
        dataKey: "simple_history",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x", label: "xᵢ = g(xᵢ₋₁)", format: "number" },
        ],
      },
    ],
  },

  {
    slug: "lagrange",
    name: "Polinomio de Lagrange",
    description:
      "Construye el polinomio interpolante único de grado ≤ n − 1 que pasa por n puntos dados, usando la base de Lagrange.",
    params: [
      {
        name: "x_points",
        label: "Valores de x (separados por coma)",
        type: "string",
        default: "0, 1, 2, 3, 4",
        placeholder: "Ej: 0, 1, 2, 3, 4",
        description: "Todos los xᵢ deben ser distintos.",
      },
      {
        name: "y_points",
        label: "Valores de y (separados por coma)",
        type: "string",
        default: "1, 2, 0, 2, 3",
        placeholder: "Ej: 1, 2, 0, 2, 3",
        description: "Misma cantidad que los x.",
      },
    ],
    output: [
      {
        kind: "scalar",
        metadataKey: "n_points",
        label: "Puntos",
        format: "integer",
      },
      {
        kind: "scalar",
        metadataKey: "degree",
        label: "Grado del polinomio",
        format: "integer",
      },
      {
        kind: "scalar",
        metadataKey: "polynomial",
        label: "Polinomio interpolante",
        format: "string",
      },
      {
        kind: "line-chart",
        xKey: "x",
        yKey: "y",
        xLabel: "x",
        yLabel: "P(x)",
      },
    ],
  },

  {
    slug: "midpoint-rectangle",
    name: "Rectángulo medio (Cotes)",
    description:
      "Regla del rectángulo medio compuesta (Newton-Cotes). Aproxima ∫ₐᵇ f(x) dx evaluando f en el punto medio de cada subintervalo.",
    params: [
      {
        name: "expression",
        label: "Función f(x)",
        type: "string",
        default: "sin(x)",
        placeholder: "Ej: sin(x)",
        description:
          "Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      {
        name: "a",
        label: "Límite inferior (a)",
        type: "number",
        default: 0,
        step: 0.1,
      },
      {
        name: "b",
        label: "Límite superior (b)",
        type: "number",
        default: 3.141592653589793,
        step: 0.1,
        description: "Para usar π exacto: 3.141592653589793.",
      },
      {
        name: "n",
        label: "Subintervalos (n)",
        type: "number",
        default: 10,
        min: 1,
        max: 10000,
        step: 1,
      },
    ],
    output: [
      {
        kind: "scalar",
        metadataKey: "integral",
        label: "Integral aproximada",
        format: "number",
      },
      {
        kind: "scalar",
        metadataKey: "h",
        label: "Paso (h)",
        format: "number",
      },
      {
        kind: "scalar",
        metadataKey: "n",
        label: "Subintervalos",
        format: "integer",
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
        title: "Subintervalos",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x_left", label: "xᵢ⁻", format: "number" },
          { key: "x_medio", label: "x̄ᵢ", format: "number" },
          { key: "x_right", label: "xᵢ⁺", format: "number" },
          { key: "f_x_medio", label: "f(x̄ᵢ)", format: "number" },
          { key: "area", label: "h·f(x̄ᵢ)", format: "scientific" },
          { key: "cumulative", label: "acumulado", format: "number" },
        ],
      },
    ],
  },
];

MODELS.push(
  {
    slug: "trapezoid",
    name: "Trapecio compuesto",
    description:
      "Aproxima ∫ₐᵇ f(x) dx uniendo los puntos consecutivos con segmentos rectos (Newton-Cotes orden 1). Sin restricciones sobre n.",
    params: [
      {
        name: "expression",
        label: "Función f(x)",
        type: "string",
        default: "sin(x)",
        placeholder: "Ej: sin(x)",
        description:
          "Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      { name: "a", label: "Límite inferior (a)", type: "number", default: 0, step: 0.1 },
      {
        name: "b",
        label: "Límite superior (b)",
        type: "number",
        default: 3.141592653589793,
        step: 0.1,
        description: "Para usar π exacto: 3.141592653589793.",
      },
      {
        name: "n",
        label: "Subintervalos (n)",
        type: "number",
        default: 10,
        min: 1,
        max: 10000,
        step: 1,
      },
    ],
    output: [
      { kind: "scalar", metadataKey: "integral", label: "Integral aproximada", format: "number" },
      { kind: "scalar", metadataKey: "h", label: "Paso (h)", format: "number" },
      { kind: "scalar", metadataKey: "n", label: "Subintervalos", format: "integer" },
      { kind: "line-chart", xKey: "x", yKey: "y", xLabel: "x", yLabel: "f(x)" },
      {
        kind: "table",
        title: "Subintervalos",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x_left", label: "xᵢ", format: "number" },
          { key: "x_right", label: "xᵢ₊₁", format: "number" },
          { key: "f_left", label: "f(xᵢ)", format: "number" },
          { key: "f_right", label: "f(xᵢ₊₁)", format: "number" },
          { key: "area", label: "área = h·(f_l+f_r)/2", format: "scientific" },
          { key: "cumulative", label: "acumulado", format: "number" },
        ],
      },
    ],
  },
  {
    slug: "simpson-one-third",
    name: "Regla de Simpson 1/3",
    description:
      "Aproxima ∫ₐᵇ f(x) dx ajustando parábolas (Newton-Cotes orden 2). Patrón 1, 4, 2, 4, …, 4, 1. Requiere n par.",
    params: [
      {
        name: "expression",
        label: "Función f(x)",
        type: "string",
        default: "sin(x)",
        placeholder: "Ej: sin(x)",
        description:
          "Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      { name: "a", label: "Límite inferior (a)", type: "number", default: 0, step: 0.1 },
      {
        name: "b",
        label: "Límite superior (b)",
        type: "number",
        default: 3.141592653589793,
        step: 0.1,
        description: "Para usar π exacto: 3.141592653589793.",
      },
      {
        name: "n",
        label: "Subintervalos (n, par)",
        type: "number",
        default: 10,
        min: 2,
        max: 10000,
        step: 2,
        description: "Debe ser par (si es impar el método no aplica directo).",
      },
    ],
    output: [
      { kind: "scalar", metadataKey: "integral", label: "Integral aproximada", format: "number" },
      { kind: "scalar", metadataKey: "h", label: "Paso (h)", format: "number" },
      { kind: "scalar", metadataKey: "n", label: "Subintervalos", format: "integer" },
      { kind: "line-chart", xKey: "x", yKey: "y", xLabel: "x", yLabel: "f(x)" },
      {
        kind: "table",
        title: "Puntos y coeficientes",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x_i", label: "xᵢ", format: "number" },
          { key: "f_x_i", label: "f(xᵢ)", format: "number" },
          { key: "coef", label: "coef.", format: "integer" },
          { key: "contrib", label: "coef·f(xᵢ)", format: "number" },
        ],
      },
    ],
  },
  {
    slug: "finite-differences",
    name: "Diferencias divididas / finitas",
    description:
      "Aproxima f'(x) y f''(x) sobre una tabla de puntos uniformemente espaciados usando los esquemas progresivo, regresivo y central.",
    params: [
      {
        name: "x_points",
        label: "Valores de x (separados por coma)",
        type: "string",
        default: "1, 3, 5, 7, 9, 11",
        placeholder: "Ej: 1, 3, 5, 7, 9, 11",
        description: "Deben tener paso h constante.",
      },
      {
        name: "y_points",
        label: "Valores de f(x) (separados por coma)",
        type: "string",
        default: "900, 2200, 3100, 3800, 4200, 4600",
        placeholder: "Ej: 900, 2200, 3100, 3800, 4200, 4600",
      },
      {
        name: "target_x",
        label: "x objetivo (opcional)",
        type: "string",
        default: "5",
        placeholder: "Vacío = punto medio",
        description: "Valor de x donde comparar los tres esquemas.",
      },
    ],
    output: [
      { kind: "scalar", metadataKey: "n_points", label: "Puntos", format: "integer" },
      { kind: "scalar", metadataKey: "h", label: "Paso (h)", format: "number" },
      { kind: "scalar", metadataKey: "target_x", label: "x objetivo", format: "number" },
      { kind: "scalar", metadataKey: "target_y", label: "f(x objetivo)", format: "number" },
      { kind: "scalar", metadataKey: "d1_forward", label: "f' progresiva", format: "number" },
      { kind: "scalar", metadataKey: "d1_backward", label: "f' regresiva", format: "number" },
      { kind: "scalar", metadataKey: "d1_central", label: "f' central", format: "number" },
      { kind: "scalar", metadataKey: "d2_forward", label: "f'' progresiva", format: "number" },
      { kind: "scalar", metadataKey: "d2_backward", label: "f'' regresiva", format: "number" },
      { kind: "scalar", metadataKey: "d2_central", label: "f'' central", format: "number" },
      { kind: "line-chart", xKey: "x", yKey: "y", xLabel: "x", yLabel: "f(x)" },
      {
        kind: "table",
        title: "Esquema mixto (progresiva al inicio, central al medio, regresiva al final)",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x", label: "x", format: "number" },
          { key: "y", label: "f(x)", format: "number" },
          { key: "method_d1", label: "esq. f'", format: "string" },
          { key: "d1", label: "f'(x)", format: "number" },
          { key: "method_d2", label: "esq. f''", format: "string" },
          { key: "d2", label: "f''(x)", format: "number" },
        ],
      },
    ],
  },
  {
    slug: "monte-carlo",
    name: "Método de Monte Carlo",
    description:
      "Aproxima ∫ₐᵇ f(x) dx por muestreo aleatorio uniforme: Î = (b−a)·(1/n)·Σ f(xᵢ). Reporta intervalo de confianza al 95%.",
    params: [
      {
        name: "expression",
        label: "Función f(x)",
        type: "string",
        default: "exp(-x**2)",
        placeholder: "Ej: exp(-x**2)",
        description:
          "Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      { name: "a", label: "Límite inferior (a)", type: "number", default: 0, step: 0.1 },
      { name: "b", label: "Límite superior (b)", type: "number", default: 1, step: 0.1 },
      {
        name: "n",
        label: "Muestras (n)",
        type: "number",
        default: 10000,
        min: 10,
        max: 5000000,
        step: 1,
        description: "El error decrece como σ/√n. Para 1 decimal extra, n×100.",
      },
      {
        name: "seed",
        label: "Semilla (opcional)",
        type: "string",
        default: "42",
        placeholder: "Vacío = aleatorio",
        description: "Entero para reproducibilidad. Vacío o 'auto' usa azar real.",
      },
    ],
    output: [
      { kind: "scalar", metadataKey: "integral", label: "Integral aproximada (Î)", format: "number" },
      { kind: "scalar", metadataKey: "ic_lo", label: "IC 95% (inf.)", format: "number" },
      { kind: "scalar", metadataKey: "ic_hi", label: "IC 95% (sup.)", format: "number" },
      { kind: "scalar", metadataKey: "sigma", label: "σ (desv. estándar)", format: "number" },
      { kind: "scalar", metadataKey: "ee", label: "Error estándar", format: "scientific" },
      { kind: "scalar", metadataKey: "n", label: "Muestras", format: "integer" },
      { kind: "scalar", metadataKey: "seed", label: "Semilla", format: "string" },
      { kind: "line-chart", xKey: "x", yKey: "y", xLabel: "x", yLabel: "f(x)" },
      {
        kind: "table",
        title: "Convergencia (estimador parcial con primeras k muestras)",
        dataKey: "table",
        columns: [
          { key: "k", label: "k", format: "integer" },
          { key: "mean", label: "promedio", format: "number" },
          { key: "integral", label: "Î_k", format: "number" },
          { key: "sigma", label: "σ", format: "number" },
          { key: "ee", label: "EE = σ/√k", format: "scientific" },
          { key: "ic_lo", label: "IC inf.", format: "number" },
          { key: "ic_hi", label: "IC sup.", format: "number" },
        ],
      },
    ],
  },
  {
    slug: "simpson-three-eighths",
    name: "Regla de Simpson 3/8",
    description:
      "Aproxima ∫ₐᵇ f(x) dx con polinomios cúbicos (Newton-Cotes orden 3). Patrón 1, 3, 3, 2, 3, 3, 2, …, 1. Requiere n múltiplo de 3.",
    params: [
      {
        name: "expression",
        label: "Función f(x)",
        type: "string",
        default: "sin(x)",
        placeholder: "Ej: sin(x)",
        description:
          "Variable: x. Funciones permitidas: sin, cos, tan, exp, log, log10, sqrt, abs, pow. Constantes: pi, e.",
      },
      { name: "a", label: "Límite inferior (a)", type: "number", default: 0, step: 0.1 },
      {
        name: "b",
        label: "Límite superior (b)",
        type: "number",
        default: 3.141592653589793,
        step: 0.1,
        description: "Para usar π exacto: 3.141592653589793.",
      },
      {
        name: "n",
        label: "Subintervalos (n, múltiplo de 3)",
        type: "number",
        default: 9,
        min: 3,
        max: 10000,
        step: 3,
        description: "Valores válidos: 3, 6, 9, 12, …",
      },
    ],
    output: [
      { kind: "scalar", metadataKey: "integral", label: "Integral aproximada", format: "number" },
      { kind: "scalar", metadataKey: "h", label: "Paso (h)", format: "number" },
      { kind: "scalar", metadataKey: "n", label: "Subintervalos", format: "integer" },
      { kind: "line-chart", xKey: "x", yKey: "y", xLabel: "x", yLabel: "f(x)" },
      {
        kind: "table",
        title: "Puntos y coeficientes",
        dataKey: "table",
        columns: [
          { key: "i", label: "i", format: "integer" },
          { key: "x_i", label: "xᵢ", format: "number" },
          { key: "f_x_i", label: "f(xᵢ)", format: "number" },
          { key: "coef", label: "coef.", format: "integer" },
          { key: "contrib", label: "coef·f(xᵢ)", format: "number" },
        ],
      },
    ],
  },
);

export function getModel(slug: string): ModelDefinition | undefined {
  return MODELS.find((m) => m.slug === slug);
}
