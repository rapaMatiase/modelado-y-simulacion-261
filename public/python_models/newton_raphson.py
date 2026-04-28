"""Newton-Raphson: x_{n+1} = x_n - f(x_n) / f'(x_n).

Iterates from x0 using the tangent at x_n to step toward a root of f(x).
The derivative is approximated with a central finite difference, so the
user only has to supply f(x). Detects f'(x) ≈ 0 (the method's failure
mode) and reports it via metadata instead of crashing.
"""

from __future__ import annotations

import ast
import json
import math
import sys
from typing import Any, Callable

import numpy as np


_ALLOWED_NAMES: dict[str, Any] = {
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "atan2": math.atan2,
    "sinh": math.sinh,
    "cosh": math.cosh,
    "tanh": math.tanh,
    "exp": math.exp,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "sqrt": math.sqrt,
    "abs": abs,
    "pow": pow,
    "pi": math.pi,
    "e": math.e,
}

_ALLOWED_NODES = (
    ast.Expression,
    ast.BinOp,
    ast.UnaryOp,
    ast.Constant,
    ast.Name,
    ast.Call,
    ast.Load,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.FloorDiv,
    ast.Mod,
    ast.Pow,
    ast.UAdd,
    ast.USub,
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


def _derivative(f: Callable[[float], float], x: float, h: float = 1e-5) -> float:
    return (f(x + h) - f(x - h)) / (2.0 * h)


def solve(params: dict[str, Any]) -> dict[str, Any]:
    expr = str(params.get("expression", "x**3 - x - 4")).strip()
    if not expr:
        raise ValueError("La función f(x) no puede estar vacía")

    x0 = float(params.get("x0", 1.0))
    tol = float(params.get("tolerance", 1e-6))
    max_iter = int(params.get("max_iter", 100))

    if tol <= 0:
        raise ValueError("La tolerancia debe ser mayor a 0")
    if max_iter < 1 or max_iter > 1000:
        raise ValueError("max_iter debe estar en [1, 1000]")

    f = _make_function(expr)

    iterations: list[dict[str, float]] = []
    x = x0
    root: float | None = None
    converged = False
    derivative_zero = False
    diverged = False

    for i in range(1, max_iter + 1):
        fx = f(x)
        dfx = _derivative(f, x)

        if not (math.isfinite(fx) and math.isfinite(dfx)):
            iterations.append(
                {
                    "i": i,
                    "x_prev": x,
                    "f_x": fx,
                    "df_x": dfx,
                    "x_new": float("nan"),
                    "abs_error": float("nan"),
                }
            )
            diverged = True
            break

        if abs(dfx) < 1e-15:
            iterations.append(
                {
                    "i": i,
                    "x_prev": x,
                    "f_x": fx,
                    "df_x": dfx,
                    "x_new": float("nan"),
                    "abs_error": float("nan"),
                }
            )
            derivative_zero = True
            break

        x_new = x - fx / dfx
        abs_err = abs(x_new - x)

        iterations.append(
            {
                "i": i,
                "x_prev": x,
                "f_x": fx,
                "df_x": dfx,
                "x_new": x_new,
                "abs_error": abs_err,
            }
        )

        if abs_err < tol:
            root = x_new
            converged = True
            break

        x = x_new

    if root is None:
        root = x

    # Sample f(x) over a window covering x0 + every iteration point, padded
    seen = [x0] + [
        row["x_new"]
        for row in iterations
        if math.isfinite(row.get("x_new", float("nan")))
    ]
    x_lo = min(seen)
    x_hi = max(seen)
    span = max(x_hi - x_lo, 1.0)
    pad = span * 0.5
    xs = np.linspace(x_lo - pad, x_hi + pad, 300)
    series = [{"x": float(xi), "y": float(f(float(xi)))} for xi in xs]

    return {
        "series": series,
        "table": iterations,
        "metadata": {
            "root": float(root),
            "f_root": float(f(root)) if math.isfinite(root) else float("nan"),
            "iterations": len(iterations),
            "converged": bool(converged),
            "derivative_zero": bool(derivative_zero),
            "diverged": bool(diverged),
            "expression": expr,
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
