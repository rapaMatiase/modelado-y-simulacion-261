"""Composite Simpson 1/3 rule (Newton-Cotes, n=2 per panel).

Approximates ∫[a,b] f(x) dx fitting parabolas through triples of points:

    ∫[a,b] f(x) dx ≈ h/3 · [ f₀ + 4·Σ(impares) + 2·Σ(pares interiores) + fₙ ]

Requires n even.
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
    expr = str(params.get("expression", "sin(x)")).strip()
    if not expr:
        raise ValueError("La función f(x) no puede estar vacía")

    a = float(params.get("a", 0.0))
    b = float(params.get("b", math.pi))
    n = int(params.get("n", 10))

    if a >= b:
        raise ValueError("Se requiere a < b")
    if n < 2 or n > 10000:
        raise ValueError("n debe estar en [2, 10000]")
    if n % 2 != 0:
        raise ValueError("Simpson 1/3 requiere n par")

    f = _make_function(expr)
    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    ys = [f(xi) for xi in xs]

    sum_odd = sum(ys[i] for i in range(1, n, 2))
    sum_even = sum(ys[i] for i in range(2, n, 2))
    integral = (h / 3.0) * (ys[0] + ys[-1] + 4.0 * sum_odd + 2.0 * sum_even)

    table: list[dict[str, float]] = []
    for i in range(n + 1):
        if i == 0 or i == n:
            coef = 1
        elif i % 2 == 1:
            coef = 4
        else:
            coef = 2
        table.append({
            "i": i,
            "x_i": xs[i],
            "f_x_i": ys[i],
            "coef": coef,
            "contrib": coef * ys[i],
        })

    sample_count = max(400, n * 4)
    sample_xs = np.linspace(a, b, sample_count)
    series = [{"x": float(xi), "y": float(f(float(xi)))} for xi in sample_xs]
    markers = [{"x": float(xi), "y": float(yi)} for xi, yi in zip(xs, ys)]

    return {
        "series": series,
        "markers": markers,
        "table": table,
        "metadata": {
            "integral": float(integral),
            "h": float(h),
            "n": int(n),
            "a": float(a),
            "b": float(b),
            "expression": expr,
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
