"""Composite Simpson 3/8 rule (Newton-Cotes, n=3 per panel).

Approximates ∫[a,b] f(x) dx fitting cubics through groups of four points:

    ∫[a,b] f(x) dx ≈ 3h/8 · [ f₀ + 3·Σ(i=1,4,7,…) + 3·Σ(i=2,5,8,…) + 2·Σ(i=3,6,9,…) + fₙ ]

Requires n a multiple of 3.
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
    n = int(params.get("n", 9))

    if a >= b:
        raise ValueError("Se requiere a < b")
    if n < 3 or n > 10000:
        raise ValueError("n debe estar en [3, 10000]")
    if n % 3 != 0:
        raise ValueError("Simpson 3/8 requiere n múltiplo de 3")

    f = _make_function(expr)
    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    ys = [f(xi) for xi in xs]

    # Coefficient pattern: 1, 3, 3, 2, 3, 3, 2, ..., 3, 3, 1
    coefs: list[int] = []
    for i in range(n + 1):
        if i == 0 or i == n:
            coefs.append(1)
        elif i % 3 == 0:
            coefs.append(2)
        else:
            coefs.append(3)

    integral = (3.0 * h / 8.0) * sum(c * y for c, y in zip(coefs, ys))

    table = [
        {"i": i, "x_i": xs[i], "f_x_i": ys[i], "coef": coefs[i], "contrib": coefs[i] * ys[i]}
        for i in range(n + 1)
    ]

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
