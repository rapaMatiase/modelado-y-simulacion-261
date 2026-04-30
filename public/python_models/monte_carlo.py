"""Monte Carlo integration — simple (1D) and double (2D).

Approximates ∫ₐᵇ f(x) dx or ∫∫_[a,b]×[c,d] f(x, y) dy dx by uniform random
sampling and the law of large numbers:

    Î_1D = (b − a) · (1/n) · Σ f(xᵢ)
    Î_2D = (b − a)·(d − c) · (1/n) · Σ f(xᵢ, yᵢ)

Reports a configurable confidence interval, the sample variance σ² /
σ, the minimum n needed to keep the current margin of error, and the
optional real error if a known exact value is supplied.
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

# z values for common confidence levels
_Z_TABLE: dict[float, float] = {
    80.0: 1.282,
    85.0: 1.440,
    90.0: 1.645,
    95.0: 1.960,
    99.0: 2.576,
    99.7: 3.000,
}


def _validate_expression(expr: str, vars_allowed: set[str]) -> None:
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as e:
        raise ValueError(f"Expresión inválida: {e.msg}") from e
    for node in ast.walk(tree):
        if not isinstance(node, _ALLOWED_NODES):
            raise ValueError(f"Sintaxis no permitida: {type(node).__name__}")
        if isinstance(node, ast.Name) and node.id not in _ALLOWED_NAMES and node.id not in vars_allowed:
            raise ValueError(f"Nombre no permitido: '{node.id}'")
        if isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name) or node.func.id not in _ALLOWED_NAMES:
                raise ValueError("Sólo se permiten llamadas a funciones de la lista blanca")


def _make_function_1d(expr: str) -> Callable[[float], float]:
    _validate_expression(expr, {"x"})
    code = compile(expr, "<f>", "eval")
    safe_globals = {"__builtins__": {}}

    def f(x: float) -> float:
        try:
            return float(eval(code, safe_globals, {**_ALLOWED_NAMES, "x": x}))
        except (ValueError, ZeroDivisionError, OverflowError) as e:
            raise ValueError(f"Error al evaluar f({x}): {e}") from e

    return f


def _make_function_2d(expr: str) -> Callable[[float, float], float]:
    _validate_expression(expr, {"x", "y"})
    code = compile(expr, "<f>", "eval")
    safe_globals = {"__builtins__": {}}

    def f(x: float, y: float) -> float:
        try:
            return float(eval(code, safe_globals, {**_ALLOWED_NAMES, "x": x, "y": y}))
        except (ValueError, ZeroDivisionError, OverflowError) as e:
            raise ValueError(f"Error al evaluar f({x}, {y}): {e}") from e

    return f


def _z_value(confidence: float) -> float:
    if confidence in _Z_TABLE:
        return _Z_TABLE[confidence]
    # Closest match for unsupported values
    closest = min(_Z_TABLE.keys(), key=lambda k: abs(k - confidence))
    return _Z_TABLE[closest]


def _parse_optional_float(raw: Any) -> float | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if s == "" or s.lower() in {"none", "null", "auto"}:
        return None
    try:
        return float(s)
    except ValueError as exc:
        raise ValueError(f"Valor numérico inválido: '{s}'") from exc


def solve(params: dict[str, Any]) -> dict[str, Any]:
    kind = str(params.get("kind", "simple")).strip().lower()
    if kind not in {"simple", "double", "doble"}:
        raise ValueError("kind debe ser 'simple' o 'doble'")
    if kind == "doble":
        kind = "double"

    expr = str(params.get("expression", "exp(-x**2)")).strip()
    if not expr:
        raise ValueError("La función no puede estar vacía")

    a = float(params.get("a", 0.0))
    b = float(params.get("b", 1.0))
    c = float(params.get("c", 0.0))
    d = float(params.get("d", 1.0))
    n = int(params.get("n", 10000))
    confidence = float(params.get("confidence", 95))
    exact = _parse_optional_float(params.get("exact", ""))

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
    if kind == "double" and c >= d:
        raise ValueError("Se requiere c < d (integral doble)")
    if n < 10 or n > 5_000_000:
        raise ValueError("n debe estar en [10, 5.000.000]")
    if confidence <= 0 or confidence >= 100:
        raise ValueError("La confianza debe estar en (0, 100)")

    rng = np.random.default_rng(seed)
    z = _z_value(confidence)

    if kind == "simple":
        f1 = _make_function_1d(expr)
        xs = rng.uniform(a, b, n)
        fxs = np.array([f1(float(xi)) for xi in xs])
        domain_size = b - a
        domain_label = f"largo (b−a) = {domain_size}"
    else:
        f2 = _make_function_2d(expr)
        xs = rng.uniform(a, b, n)
        ys_arr = rng.uniform(c, d, n)
        fxs = np.array([f2(float(xs[i]), float(ys_arr[i])) for i in range(n)])
        domain_size = (b - a) * (d - c)
        domain_label = f"área (b−a)·(d−c) = {domain_size}"

    mean = float(np.mean(fxs))
    # Population-style variance from the sample (matches the script: E[f²] − E[f]²)
    sigma2 = float(np.mean(fxs ** 2) - mean ** 2)
    sigma2 = max(0.0, sigma2)
    sigma = math.sqrt(sigma2)
    integral = domain_size * mean
    margin = z * domain_size * sigma / math.sqrt(n)
    ic_lo = integral - margin
    ic_hi = integral + margin

    # n mínimo teórico to hold the current margin: n_min = (z·area·σ / margin)²
    if margin > 0:
        n_min = math.ceil((z * domain_size * sigma / margin) ** 2)
    else:
        n_min = n
    sufficient = n >= n_min

    abs_error = abs(integral - exact) if exact is not None else None
    rel_error_pct = (abs_error / abs(exact) * 100.0) if (exact is not None and exact != 0) else None

    # Curve / surface preview for the chart (1D only — 2D shows a slice y = (c+d)/2)
    sample_count = 400
    grid = np.linspace(a, b, sample_count)
    if kind == "simple":
        series = [{"x": float(xi), "y": float(f1(float(xi)))} for xi in grid]
    else:
        y_mid = 0.5 * (c + d)
        series = [
            {"x": float(xi), "y": float(f2(float(xi), float(y_mid)))} for xi in grid
        ]

    cap = min(n, 500)
    sample_idx = rng.choice(n, size=cap, replace=False) if cap < n else np.arange(n)
    if kind == "simple":
        markers = [{"x": float(xs[i]), "y": float(fxs[i])} for i in sample_idx]
    else:
        # Show samples projected on (x, f) for the slice; useful as visualization
        markers = [{"x": float(xs[i]), "y": float(fxs[i])} for i in sample_idx]

    # Convergence table
    checkpoints = [k for k in [10, 50, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000] if k <= n]
    if not checkpoints or checkpoints[-1] != n:
        checkpoints.append(n)
    table: list[dict[str, float]] = []
    for k in checkpoints:
        partial = fxs[:k]
        m_k = float(np.mean(partial))
        s2_k = float(max(0.0, np.mean(partial ** 2) - m_k ** 2))
        s_k = math.sqrt(s2_k)
        i_k = domain_size * m_k
        margin_k = z * domain_size * s_k / math.sqrt(k) if k > 0 else 0.0
        table.append({
            "k": int(k),
            "mean": m_k,
            "integral": i_k,
            "sigma": s_k,
            "margin": margin_k,
            "ic_lo": i_k - margin_k,
            "ic_hi": i_k + margin_k,
        })

    metadata: dict[str, Any] = {
        "kind": "Integral simple" if kind == "simple" else "Integral doble",
        "expression": expr,
        "integral": float(integral),
        "ic_lo": float(ic_lo),
        "ic_hi": float(ic_hi),
        "margin": float(margin),
        "mean": float(mean),
        "sigma": float(sigma),
        "sigma2": float(sigma2),
        "z": float(z),
        "confidence": float(confidence),
        "domain_size": float(domain_size),
        "domain_label": domain_label,
        "n": int(n),
        "n_min": int(n_min),
        "sufficient": "Sí" if sufficient else "No",
        "seed": "auto" if seed is None else str(seed),
    }
    if exact is not None:
        metadata["exact"] = float(exact)
        metadata["abs_error"] = float(abs_error) if abs_error is not None else float("nan")
        metadata["rel_error_pct"] = (
            float(rel_error_pct) if rel_error_pct is not None else "—"
        )

    return {
        "series": series,
        "markers": markers,
        "table": table,
        "metadata": metadata,
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
