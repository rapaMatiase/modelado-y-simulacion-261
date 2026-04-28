"""Fixed-point iteration: x_{n+1} = g(x_n).

Receives a g(x) expression that must come from rearranging f(x) = 0 into
x = g(x). Iterates from a starting point x0 until |x_{n+1} - x_n| < tol or
max_iter is reached. Returns per-iteration values plus a numerical estimate
of |g'(root)| (Taylor convergence condition: |g'(x)| < 1).
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
    code = compile(expr, "<g>", "eval")
    safe_globals = {"__builtins__": {}}

    def g(x: float) -> float:
        try:
            return float(eval(code, safe_globals, {**_ALLOWED_NAMES, "x": x}))
        except (ValueError, ZeroDivisionError, OverflowError) as e:
            raise ValueError(f"Error al evaluar g({x}): {e}") from e

    return g


def _derivative(g: Callable[[float], float], x: float, h: float = 1e-5) -> float:
    """Central finite difference."""
    return (g(x + h) - g(x - h)) / (2.0 * h)


def solve(params: dict[str, Any]) -> dict[str, Any]:
    expr = str(params.get("expression", "cos(x) + x")).strip()
    if not expr:
        raise ValueError("La función g(x) no puede estar vacía")

    x0 = float(params.get("x0", 1.0))
    tol = float(params.get("tolerance", 1e-6))
    max_iter = int(params.get("max_iter", 100))

    if tol <= 0:
        raise ValueError("La tolerancia debe ser mayor a 0")
    if max_iter < 1 or max_iter > 1000:
        raise ValueError("max_iter debe estar en [1, 1000]")

    g = _make_function(expr)

    iterations: list[dict[str, float]] = []
    x = x0
    root: float | None = None
    converged = False
    diverged = False

    for i in range(1, max_iter + 1):
        x_new = g(x)
        abs_err = abs(x_new - x)
        rel_err = abs_err / abs(x_new) if x_new != 0 else float("inf")

        if not math.isfinite(x_new):
            iterations.append(
                {
                    "i": i,
                    "x_prev": x,
                    "x_new": x_new,
                    "abs_error": abs_err,
                    "rel_error": rel_err,
                }
            )
            diverged = True
            break

        iterations.append(
            {
                "i": i,
                "x_prev": x,
                "x_new": x_new,
                "abs_error": abs_err,
                "rel_error": rel_err,
            }
        )

        if abs_err < tol:
            root = x_new
            converged = True
            break

        x = x_new

    if root is None:
        root = x if iterations else x0

    # |g'(root)| via central finite difference (Taylor convergence condition)
    try:
        g_prime_abs = abs(_derivative(g, root))
    except Exception:
        g_prime_abs = float("nan")

    # Iteration trajectory: i vs x value reached at that iteration
    series: list[dict[str, float]] = [{"i": 0, "x": x0}]
    for row in iterations:
        series.append({"i": float(row["i"]), "x": float(row["x_new"])})

    return {
        "series": series,
        "table": iterations,
        "metadata": {
            "root": float(root),
            "g_root": float(g(root)) if math.isfinite(root) else float("nan"),
            "iterations": len(iterations),
            "converged": bool(converged),
            "diverged": bool(diverged),
            "g_prime_abs": float(g_prime_abs),
            "convergence_ok": bool(math.isfinite(g_prime_abs) and g_prime_abs < 1.0),
            "expression": expr,
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
