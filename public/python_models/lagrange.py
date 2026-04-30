"""Lagrange interpolation polynomial.

Builds the unique polynomial of degree ≤ n − 1 that passes through n
given (x, y) points using the Lagrange basis:

    P(x) = Σᵢ yᵢ · Lᵢ(x)
    Lᵢ(x) = Π_{j≠i} (x − xⱼ) / (xᵢ − xⱼ)

The polynomial is rebuilt symbolically with numpy.poly1d so we can return
both a sampled curve for plotting and a human-readable expression.
"""

from __future__ import annotations

import json
import sys
from typing import Any

import numpy as np


def _parse_numbers(raw: str, name: str) -> list[float]:
    text = raw.strip()
    if not text:
        raise ValueError(f"'{name}' no puede estar vacío")
    parts = [p.strip() for p in text.replace(";", ",").split(",") if p.strip()]
    if not parts:
        raise ValueError(f"'{name}' no contiene valores")
    out: list[float] = []
    for p in parts:
        try:
            out.append(float(p))
        except ValueError as e:
            raise ValueError(f"'{name}': valor no numérico '{p}'") from e
    return out


def _format_polynomial(p: np.poly1d, var: str = "x") -> str:
    coeffs = list(p.coefficients)
    if not coeffs:
        return "0"
    deg = len(coeffs) - 1

    parts: list[str] = []
    for i, c in enumerate(coeffs):
        power = deg - i
        if abs(c) < 1e-12:
            continue

        sign = "−" if c < 0 else "+"
        abs_c = abs(c)
        coef_str = _format_coef(abs_c, power)

        if power == 0:
            term = coef_str
        elif power == 1:
            term = f"{coef_str}{var}" if coef_str else var
        else:
            sup = _superscript(power)
            term = f"{coef_str}{var}{sup}" if coef_str else f"{var}{sup}"

        if not parts:
            # First term: only show sign if negative
            parts.append(f"−{term}" if c < 0 else term)
        else:
            parts.append(f" {sign} {term}")

    return "".join(parts) if parts else "0"


def _format_coef(value: float, power: int) -> str:
    """Drop the leading 1 for non-constant terms; round nicely."""
    if power > 0 and abs(value - 1.0) < 1e-12:
        return ""
    # 6 significant digits, trim trailing zeros
    s = f"{value:.6g}"
    return s


_SUP_DIGITS = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")


def _superscript(n: int) -> str:
    return str(n).translate(_SUP_DIGITS)


def solve(params: dict[str, Any]) -> dict[str, Any]:
    xs = _parse_numbers(str(params.get("x_points", "")), "x_points")
    ys = _parse_numbers(str(params.get("y_points", "")), "y_points")

    if len(xs) != len(ys):
        raise ValueError(
            f"Cantidad de puntos no coincide: {len(xs)} valores de x vs {len(ys)} de y"
        )
    if len(xs) < 2:
        raise ValueError("Se necesitan al menos 2 puntos")
    if len(set(xs)) != len(xs):
        raise ValueError("Los valores de x deben ser todos distintos")

    n = len(xs)

    # Build polynomial symbolically: P = Σ yᵢ · Lᵢ
    polynomial = np.poly1d([0.0])
    for i in range(n):
        Li = np.poly1d([1.0])
        for j in range(n):
            if j == i:
                continue
            Li *= np.poly1d([1.0, -xs[j]]) / (xs[i] - xs[j])
        polynomial += ys[i] * Li

    # Sample over the original range plus a small margin (10% of span, min 0.5)
    x_min = min(xs)
    x_max = max(xs)
    span = x_max - x_min
    margin = max(span * 0.1, 0.5)
    sample_xs = np.linspace(x_min - margin, x_max + margin, 400)
    sample_ys = polynomial(sample_xs)
    series = [
        {"x": float(xi), "y": float(yi)} for xi, yi in zip(sample_xs, sample_ys)
    ]

    markers = [{"x": float(xi), "y": float(yi)} for xi, yi in zip(xs, ys)]

    return {
        "series": series,
        "markers": markers,
        "metadata": {
            "n_points": n,
            "degree": int(polynomial.order),
            "polynomial": f"P(x) = {_format_polynomial(polynomial)}",
            "coefficients": [float(c) for c in polynomial.coefficients],
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
