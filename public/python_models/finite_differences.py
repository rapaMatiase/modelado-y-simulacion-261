"""Finite differences (forward, backward, central).

Approximates the first and second derivative of a function known only on
a uniform grid of (x, y) samples. Reports the three schemes at a target
point and assembles a mixed-scheme derivative across the whole table:
forward at the left endpoint, central in the interior, backward at the
right endpoint.
"""

from __future__ import annotations

import json
import sys
from typing import Any


def _parse_floats(raw: Any) -> list[float]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [float(v) for v in raw]
    text = str(raw).replace(";", ",").replace("\n", ",")
    parts = [p.strip() for p in text.split(",") if p.strip()]
    out: list[float] = []
    for p in parts:
        try:
            out.append(float(p))
        except ValueError as exc:
            raise ValueError(f"No se pudo parsear el número: '{p}'") from exc
    return out


def _scheme_first(ys: list[float], i: int, h: float, kind: str) -> float | None:
    n = len(ys)
    if kind == "forward" and i + 1 < n:
        return (ys[i + 1] - ys[i]) / h
    if kind == "backward" and i - 1 >= 0:
        return (ys[i] - ys[i - 1]) / h
    if kind == "central" and 0 < i < n - 1:
        return (ys[i + 1] - ys[i - 1]) / (2.0 * h)
    return None


def _scheme_second(ys: list[float], i: int, h: float, kind: str) -> float | None:
    n = len(ys)
    if kind == "forward" and i + 2 < n:
        return (ys[i + 2] - 2.0 * ys[i + 1] + ys[i]) / (h * h)
    if kind == "backward" and i - 2 >= 0:
        return (ys[i] - 2.0 * ys[i - 1] + ys[i - 2]) / (h * h)
    if kind == "central" and 0 < i < n - 1:
        return (ys[i + 1] - 2.0 * ys[i] + ys[i - 1]) / (h * h)
    return None


def solve(params: dict[str, Any]) -> dict[str, Any]:
    xs = _parse_floats(params.get("x_points", ""))
    ys = _parse_floats(params.get("y_points", ""))

    if len(xs) < 3:
        raise ValueError("Se requieren al menos 3 puntos")
    if len(xs) != len(ys):
        raise ValueError("Las listas de x e y deben tener la misma cantidad de valores")

    n = len(xs)
    # Verify uniform spacing
    h = xs[1] - xs[0]
    if h <= 0:
        raise ValueError("Los valores de x deben ser crecientes")
    tol = abs(h) * 1e-6 + 1e-9
    for i in range(1, n):
        diff = xs[i] - xs[i - 1]
        if abs(diff - h) > tol:
            raise ValueError(
                f"El paso h debe ser constante (entre x[{i-1}] y x[{i}] difiere)"
            )

    # Target index: by default the middle point, or the closest to target_x
    raw_target = params.get("target_x", "")
    target_str = str(raw_target).strip() if raw_target is not None else ""
    if target_str == "":
        target_idx = n // 2
    else:
        try:
            target_x = float(target_str)
        except ValueError as exc:
            raise ValueError("target_x debe ser numérico o vacío") from exc
        target_idx = min(range(n), key=lambda i: abs(xs[i] - target_x))

    target_x_val = xs[target_idx]

    # Three-scheme report at target
    target_first = {
        "forward": _scheme_first(ys, target_idx, h, "forward"),
        "backward": _scheme_first(ys, target_idx, h, "backward"),
        "central": _scheme_first(ys, target_idx, h, "central"),
    }
    target_second = {
        "forward": _scheme_second(ys, target_idx, h, "forward"),
        "backward": _scheme_second(ys, target_idx, h, "backward"),
        "central": _scheme_second(ys, target_idx, h, "central"),
    }

    def _fmt(v: float | None) -> float | str:
        return v if v is not None else "—"

    # Mixed-scheme derivatives across the whole table
    table: list[dict[str, Any]] = []
    primera_series: list[dict[str, float]] = []
    segunda_series: list[dict[str, float]] = []

    for i in range(n):
        if i == 0:
            kind1 = "forward"
        elif i == n - 1:
            kind1 = "backward"
        else:
            kind1 = "central"

        if 0 < i < n - 1:
            kind2 = "central"
        elif i == 0 or i == 1:
            kind2 = "forward" if i + 2 < n else "backward"
        else:
            kind2 = "backward"

        d1 = _scheme_first(ys, i, h, kind1)
        d2 = _scheme_second(ys, i, h, kind2)
        if d1 is None and kind1 == "central":
            d1 = _scheme_first(ys, i, h, "forward") or _scheme_first(ys, i, h, "backward")
        if d2 is None:
            d2 = _scheme_second(ys, i, h, "central") or _scheme_second(ys, i, h, "forward") or _scheme_second(ys, i, h, "backward")

        table.append({
            "i": i,
            "x": xs[i],
            "y": ys[i],
            "method_d1": kind1,
            "d1": d1 if d1 is not None else "—",
            "method_d2": kind2,
            "d2": d2 if d2 is not None else "—",
        })
        if d1 is not None:
            primera_series.append({"x": xs[i], "y": d1})
        if d2 is not None:
            segunda_series.append({"x": xs[i], "y": d2})

    # Original data series for the chart
    series = [{"x": xs[i], "y": ys[i]} for i in range(n)]
    markers = [{"x": target_x_val, "y": ys[target_idx]}]

    return {
        "series": series,
        "markers": markers,
        "primera_series": primera_series,
        "segunda_series": segunda_series,
        "table": table,
        "metadata": {
            "n_points": int(n),
            "h": float(h),
            "target_x": float(target_x_val),
            "target_idx": int(target_idx),
            "target_y": float(ys[target_idx]),
            "d1_forward": _fmt(target_first["forward"]),
            "d1_backward": _fmt(target_first["backward"]),
            "d1_central": _fmt(target_first["central"]),
            "d2_forward": _fmt(target_second["forward"]),
            "d2_backward": _fmt(target_second["backward"]),
            "d2_central": _fmt(target_second["central"]),
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
