"""Vercel Python serverless dispatcher for numerical models.

Receives POST requests at /api/solver/<modelName>, looks up the matching
module under python_models/, calls its `solve(params)` function and returns
the JSON result. Errors are caught and returned as structured JSON so the
frontend can surface them.
"""

from __future__ import annotations

import importlib
import json
import os
import sys
import traceback
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)


class ModelNotFoundError(Exception):
    pass


class InvalidParamsError(Exception):
    pass


class handler(BaseHTTPRequestHandler):  # noqa: N801 — Vercel requires lowercase
    def do_POST(self) -> None:  # noqa: N802
        try:
            model_name = self._extract_model_name()
            params = self._read_json_body()
            result = self._dispatch(model_name, params)
            self._send(200, {"ok": True, "data": result})
        except ModelNotFoundError as e:
            self._send(404, {"ok": False, "error": str(e)})
        except InvalidParamsError as e:
            self._send(400, {"ok": False, "error": str(e)})
        except ValueError as e:
            self._send(422, {"ok": False, "error": "Invalid parameter", "detail": str(e)})
        except Exception as e:
            tail = traceback.format_exc().splitlines()[-3:]
            self._send(
                500,
                {
                    "ok": False,
                    "error": "Model execution failed",
                    "detail": f"{type(e).__name__}: {e}",
                    "trace": tail,
                },
            )

    def do_GET(self) -> None:  # noqa: N802
        self._send(405, {"ok": False, "error": "Use POST with JSON body"})

    def log_message(self, fmt: str, *args: object) -> None:  # silence default stderr noise
        return

    def _extract_model_name(self) -> str:
        path = urlparse(self.path).path
        parts = [p for p in path.split("/") if p]
        if len(parts) < 3 or parts[0] != "api" or parts[1] != "solver":
            raise ModelNotFoundError(f"Invalid path: {path}")
        return parts[2]

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("content-length") or 0)
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as e:
            raise InvalidParamsError(f"Invalid JSON body: {e}") from e
        if not isinstance(payload, dict):
            raise InvalidParamsError("Body must be a JSON object")
        return payload

    def _dispatch(self, model_name: str, params: dict) -> dict:
        module_name = model_name.replace("-", "_")
        try:
            module = importlib.import_module(f"python_models.{module_name}")
        except ModuleNotFoundError as e:
            if e.name and e.name.startswith("python_models"):
                raise ModelNotFoundError(f"Model '{model_name}' not found") from e
            raise

        solve = getattr(module, "solve", None)
        if not callable(solve):
            raise ModelNotFoundError(
                f"Model '{model_name}' is missing a callable solve()"
            )

        result = solve(params)
        if not isinstance(result, dict):
            raise RuntimeError("Model solve() must return a dict")
        return result

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
