"""Bisection method for finding a root of f(x) = 0 in [a, b].

The user-provided expression is parsed and validated via AST so that only
arithmetic, whitelisted math functions and the variable `x` are allowed.
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
            raise ValueError(
                f"Sintaxis no permitida: {type(node).__name__}"
            )
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
    expr = str(params.get("expression", "x**3 - x - 2")).strip()
    if not expr:
        raise ValueError("La función f(x) no puede estar vacía")

    a = float(params.get("a", 1.0))
    b = float(params.get("b", 2.0))
    tol = float(params.get("tolerance", 1e-6))
    max_iter = int(params.get("max_iter", 100))

    if a >= b:
        raise ValueError("Se requiere a < b")
    if tol <= 0:
        raise ValueError("La tolerancia debe ser mayor a 0")
    if max_iter < 1 or max_iter > 1000:
        raise ValueError("max_iter debe estar en [1, 1000]")

    f = _make_function(expr)

    fa0 = f(a)
    fb0 = f(b)

    # Bolzano: f(a) * f(b) < 0 garantiza raíz en [a, b] para f continua
    if fa0 * fb0 >= 0:
        raise ValueError(
            "No se cumple el teorema de Bolzano: "
            f"f({a}) = {fa0:.6g}, f({b}) = {fb0:.6g}, producto = {fa0 * fb0:.6g} ≥ 0"
        )

    cur_a, cur_b = a, b
    iterations: list[dict[str, float]] = []
    root: float | None = None
    converged = False

    for i in range(1, max_iter + 1):
        c = (cur_a + cur_b) / 2.0
        fa = f(cur_a)
        fb = f(cur_b)
        fc = f(c)
        err = abs(cur_b - cur_a) / 2.0

        iterations.append(
            {
                "i": i,
                "a": cur_a,
                "b": cur_b,
                "c": c,
                "f_a": fa,
                "f_b": fb,
                "f_c": fc,
                "error": err,
            }
        )

        if abs(fc) < tol or err < tol:
            root = c
            converged = True
            break

        # f(a)*f(c) < 0 → raíz en [a, c] → b ← c; sino raíz en [c, b] → a ← c
        if fa * fc < 0:
            cur_b = c
        else:
            cur_a = c

    if root is None:
        root = (cur_a + cur_b) / 2.0

    # Curva f(x) sobre el intervalo original para graficar
    xs = np.linspace(a, b, 300)
    series = [{"x": float(xi), "y": float(f(float(xi)))} for xi in xs]

    return {
        "series": series,
        "table": iterations,
        "metadata": {
            "root": float(root),
            "f_root": float(f(root)),
            "iterations": len(iterations),
            "converged": bool(converged),
            "expression": expr,
            "a": a,
            "b": b,
            "tolerance": tol,
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
