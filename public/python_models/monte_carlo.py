"""Monte Carlo integration (1D, sample-mean estimator).

Approximates ∫[a,b] f(x) dx by drawing n uniform samples xᵢ ∈ [a,b] and
applying the law of large numbers:

    Î = (b − a) · (1/n) · Σ f(xᵢ)

Reports the 95% confidence interval using the sample standard deviation
of the f(xᵢ) values: Î ± 1.96 · (b − a) · σ / √n.
"""

from __future__ import annotations

import ast
import json
import math
import sys
from typing import Any, Callable

import numpy as np


_ALLOWED_NAMES: dict[str, Any] = {
    "sin": math.sin, "cos": math.cos, "tan": math.tan,
    "asin": math.asin, "acos": math.acos, "atan": math.atan, "atan2": math.atan2,
    "sinh": math.sinh, "cosh": math.cosh, "tanh": math.tanh,
    "exp": math.exp, "log": math.log, "log10": math.log10, "log2": math.log2,
    "sqrt": math.sqrt, "abs": abs, "pow": pow,
    "pi": math.pi, "e": math.e,
}

_ALLOWED_NODES = (
    ast.Expression, ast.BinOp, ast.UnaryOp, ast.Constant, ast.Name,
    ast.Call, ast.Load, ast.Add, ast.Sub, ast.Mult, ast.Div,
    ast.FloorDiv, ast.Mod, ast.Pow, ast.UAdd, ast.USub,
)


def _validate_expression(expr: str) -> None:
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as e:
        raise ValueError(f"Expresión inválida: {e.msg}") from e
    for node in ast.walk(tree):
        if not isinstance(node, _ALLOWED_NODES):
            raise ValueError(f"Sintaxis no permitida: {type(node).__name__}")
        if isinstance(node, ast.Name) and node.id not in _ALLOWED_NAMES and node.id != "x":
            raise ValueError(f"Nombre no permitido: '{node.id}'")
        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name) or node.func.id not in _ALLOWED_NAMES:
                raise ValueError("Sólo se permiten llamadas a funciones de la lista blanca")


def _make_function(expr: str) -> Callable[[float], float]:
    _validate_expression(expr)
    code = compile(expr, "<f>", "eval")
    safe_globals = {"__builtins__": {}}

    def f(x: float) -> float:
        try:
            return float(eval(code, safe_globals, {**_ALLOWED_NAMES, "x": x}))
        except (ValueError, ZeroDivisionError, OverflowError) as e:
            raise ValueError(f"Error al evaluar f({x}): {e}") from e

    return f


def solve(params: dict[str, Any]) -> dict[str, Any]:
    expr = str(params.get("expression", "exp(-x**2)")).strip()
    if not expr:
        raise ValueError("La función f(x) no puede estar vacía")

    a = float(params.get("a", 0.0))
    b = float(params.get("b", 1.0))
    n = int(params.get("n", 10000))
    seed_raw = params.get("seed", "")
    seed_str = str(seed_raw).strip() if seed_raw is not None else ""
    seed: int | None
    if seed_str == "" or seed_str.lower() in {"none", "null", "auto"}:
        seed = None
    else:
        try:
            seed = int(float(seed_str))
        except (TypeError, ValueError) as exc:
            raise ValueError("La semilla debe ser un entero o estar vacía") from exc

    if a >= b:
        raise ValueError("Se requiere a < b")
    if n < 10 or n > 5_000_000:
        raise ValueError("n debe estar en [10, 5.000.000]")

    f = _make_function(expr)
    rng = np.random.default_rng(seed)
    xs = rng.uniform(a, b, n)
    fxs = np.array([f(float(xi)) for xi in xs])

    mean = float(np.mean(fxs))
    sigma = float(np.std(fxs, ddof=1)) if n > 1 else 0.0
    ee = sigma / math.sqrt(n) if n > 0 else 0.0

    integral = (b - a) * mean
    z = 1.96
    margin = z * (b - a) * ee
    ic_lo = integral - margin
    ic_hi = integral + margin

    # Curve sampling for chart
    sample_count = 400
    grid = np.linspace(a, b, sample_count)
    series = [{"x": float(xi), "y": float(f(float(xi)))} for xi in grid]

    # Show a subset of random samples on the chart (cap to keep DOM light)
    cap = min(n, 500)
    sample_idx = rng.choice(n, size=cap, replace=False) if cap < n else np.arange(n)
    markers = [
        {"x": float(xs[i]), "y": float(fxs[i])} for i in sample_idx
    ]

    # Convergence table at logarithmic checkpoints
    checkpoints = [k for k in [10, 50, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000] if k <= n]
    if not checkpoints or checkpoints[-1] != n:
        checkpoints.append(n)
    table: list[dict[str, float]] = []
    for k in checkpoints:
        partial = fxs[:k]
        m_k = float(np.mean(partial))
        s_k = float(np.std(partial, ddof=1)) if k > 1 else 0.0
        ee_k = s_k / math.sqrt(k) if k > 0 else 0.0
        i_k = (b - a) * m_k
        margin_k = z * (b - a) * ee_k
        table.append({
            "k": int(k),
            "mean": m_k,
            "integral": i_k,
            "sigma": s_k,
            "ee": ee_k,
            "ic_lo": i_k - margin_k,
            "ic_hi": i_k + margin_k,
        })

    return {
        "series": series,
        "markers": markers,
        "table": table,
        "metadata": {
            "integral": float(integral),
            "ic_lo": float(ic_lo),
            "ic_hi": float(ic_hi),
            "sigma": float(sigma),
            "ee": float(ee),
            "n": int(n),
            "a": float(a),
            "b": float(b),
            "seed": "auto" if seed is None else str(seed),
            "expression": expr,
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
