"""Aitken's Δ² acceleration applied to a fixed-point iteration.

Each step generates three successive values x, x1 = g(x), x2 = g(x1),
then computes the accelerated estimate

    x̂ = x − (x1 − x)² / (x2 − 2 x1 + x)

(falls back to x2 when the denominator vanishes), and feeds x̂ into the
next iteration. Converges much faster than plain fixed-point on linearly
convergent sequences.
"""

from __future__ import annotations

import ast
import json
import math
import sys
from typing import Any, Callable


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


def _simple_fixed_point(g: Callable[[float], float], x0: float, tol: float, max_iter: int) -> tuple[float | None, list[float], int, bool]:
    """Plain fixed-point iteration without Aitken acceleration."""
    history = [x0]
    x = x0
    for i in range(1, max_iter + 1):
        try:
            x_new = g(x)
        except ValueError:
            return None, history, i, False
        if not math.isfinite(x_new):
            return None, history, i, False
        history.append(x_new)
        if abs(x_new - x) < tol:
            return x_new, history, i, True
        x = x_new
    return None, history, max_iter, False


def solve(params: dict[str, Any]) -> dict[str, Any]:
    expr = str(params.get("expression", "sqrt(2*x - 1)")).strip()
    if not expr:
        raise ValueError("La función g(x) no puede estar vacía")

    x0 = float(params.get("x0", 2.0))
    tol = float(params.get("tolerance", 1e-6))
    max_iter = int(params.get("max_iter", 100))

    if tol <= 0:
        raise ValueError("La tolerancia debe ser mayor a 0")
    if max_iter < 1 or max_iter > 1000:
        raise ValueError("max_iter debe estar en [1, 1000]")

    g = _make_function(expr)

    iterations: list[dict[str, Any]] = []
    x = x0
    root: float | None = None
    converged = False
    diverged = False

    for i in range(1, max_iter + 1):
        x1 = g(x)
        x2 = g(x1)

        if not (math.isfinite(x1) and math.isfinite(x2)):
            iterations.append({
                "i": i, "x_n": x, "x_n1": x1, "x_n2": x2,
                "denominador": float("nan"),
                "x_hat": float("nan"), "error": float("nan"),
                "nota": "g(x) no finita — divergencia",
            })
            diverged = True
            break

        denom = x2 - 2.0 * x1 + x
        if abs(denom) > 1e-15:
            x_hat = x - (x1 - x) ** 2 / denom
            nota = "Aitken aplicado"
        else:
            x_hat = x2
            nota = "denom ≈ 0 → uso x₂"

        error = abs(x_hat - x)

        iterations.append({
            "i": i,
            "x_n": x,
            "x_n1": x1,
            "x_n2": x2,
            "denominador": denom,
            "x_hat": x_hat,
            "error": error,
            "nota": nota,
        })

        if error < tol:
            root = x_hat
            converged = True
            break

        x = x_hat

    if root is None:
        root = x

    # Iteration trajectory for Aitken: index vs accelerated value
    series_aitken: list[dict[str, float]] = [{"i": 0, "x": float(x0), "metodo": "aitken"}]
    for row in iterations:
        if math.isfinite(row.get("x_hat", float("nan"))):
            series_aitken.append({
                "i": float(row["i"]),
                "x": float(row["x_hat"]),
                "metodo": "aitken",
            })

    # Plain fixed-point reference for comparison
    simple_root, simple_history, simple_iters, simple_converged = _simple_fixed_point(
        g, x0, tol, max(max_iter * 5, 200)
    )
    simple_history_data = [
        {"i": idx, "x": float(val)} for idx, val in enumerate(simple_history)
    ]

    series = series_aitken

    g_root = float(g(root)) if math.isfinite(root) else float("nan")
    iter_aitken = len(iterations)
    if simple_iters and simple_converged and simple_iters > 0:
        reduction_pct = 100.0 * (simple_iters - iter_aitken) / simple_iters
        comp_text = f"Punto fijo: {simple_iters} iter · Aitken: {iter_aitken} iter ({reduction_pct:.1f}% menos)"
    elif simple_converged is False:
        comp_text = f"Aitken: {iter_aitken} iter · Punto fijo simple no convergió"
    else:
        comp_text = f"Aitken: {iter_aitken} iter · Punto fijo: {simple_iters} iter"

    return {
        "series": series,
        "simple_history": simple_history_data,
        "table": iterations,
        "metadata": {
            "root": float(root),
            "g_root": g_root,
            "g_root_diff": float(abs(g_root - root)) if math.isfinite(g_root) else float("nan"),
            "iterations": iter_aitken,
            "iterations_simple": int(simple_iters),
            "simple_converged": bool(simple_converged),
            "comparison": comp_text,
            "converged": bool(converged),
            "diverged": bool(diverged),
            "expression": expr,
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
