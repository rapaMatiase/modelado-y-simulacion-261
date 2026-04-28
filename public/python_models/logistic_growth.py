"""Logistic growth model: dx/dt = r * x * (1 - x / K).

Exposed as `solve(params)` for the serverless dispatcher and as a CLI
(`python python_models/logistic_growth.py < params.json`) for local testing.
"""

from __future__ import annotations

import json
import sys
from typing import Any

import numpy as np
from scipy.integrate import odeint


DEFAULTS = {"r": 0.4, "K": 100.0, "x0": 2.0, "t_max": 50.0, "steps": 200}


def _coerce_float(params: dict, key: str) -> float:
    raw = params.get(key, DEFAULTS[key])
    try:
        return float(raw)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Parameter '{key}' must be a number") from e


def _coerce_int(params: dict, key: str) -> int:
    raw = params.get(key, DEFAULTS[key])
    try:
        return int(raw)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Parameter '{key}' must be an integer") from e


def solve(params: dict[str, Any]) -> dict[str, Any]:
    r = _coerce_float(params, "r")
    K = _coerce_float(params, "K")
    x0 = _coerce_float(params, "x0")
    t_max = _coerce_float(params, "t_max")
    steps = _coerce_int(params, "steps")

    if r <= 0:
        raise ValueError("r must be greater than 0")
    if K <= 0:
        raise ValueError("K must be greater than 0")
    if x0 <= 0:
        raise ValueError("x0 must be greater than 0")
    if t_max <= 0:
        raise ValueError("t_max must be greater than 0")
    if steps < 2 or steps > 5000:
        raise ValueError("steps must be in [2, 5000]")

    t = np.linspace(0.0, t_max, steps)

    def dxdt(x: float, _t: float, r: float, K: float) -> float:
        return r * x * (1.0 - x / K)

    sol = odeint(dxdt, x0, t, args=(r, K))
    x = sol[:, 0]

    series = [{"t": float(ti), "x": float(xi)} for ti, xi in zip(t, x)]

    return {
        "series": series,
        "metadata": {
            "model": "logistic_growth",
            "r": r,
            "K": K,
            "x0": x0,
            "t_max": t_max,
            "steps": steps,
            "x_final": float(x[-1]),
        },
    }


if __name__ == "__main__":
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    sys.stdout.write(json.dumps(solve(payload)))
