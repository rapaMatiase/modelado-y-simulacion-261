"use client";

const PYODIDE_VERSION = "0.27.7";
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

type LoadPyodideFn = (opts: { indexURL: string }) => Promise<PyodideAPI>;

interface PyodideAPI {
  loadPackage: (names: string | string[]) => Promise<void>;
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (name: string, value: unknown) => void;
  };
  FS: {
    mkdirTree: (path: string) => void;
    writeFile: (path: string, content: string) => void;
  };
}

declare global {
  interface Window {
    loadPyodide?: LoadPyodideFn;
  }
}

export type ProgressCallback = (message: string) => void;

let pyodidePromise: Promise<PyodideAPI> | null = null;
const moduleCache = new Set<string>();

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Array.from(document.scripts).some((s) => s.src === src)) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(el);
  });
}

export async function getPyodide(
  onProgress?: ProgressCallback,
): Promise<PyodideAPI> {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    onProgress?.("Cargando runtime Pyodide…");
    await loadScript(`${PYODIDE_INDEX}pyodide.js`);
    if (!window.loadPyodide) {
      throw new Error("Pyodide no se inicializó correctamente");
    }
    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX });

    onProgress?.("Cargando NumPy y SciPy (primera vez ~30s)…");
    await pyodide.loadPackage(["numpy", "scipy"]);

    pyodide.FS.mkdirTree("/python_models");
    pyodide.FS.writeFile("/python_models/__init__.py", "");
    pyodide.runPython(`
import sys
if "/python_models" not in sys.path:
    sys.path.insert(0, "/python_models")
`);
    return pyodide;
  })();

  try {
    return await pyodidePromise;
  } catch (e) {
    pyodidePromise = null;
    throw e;
  }
}

export async function runModel<T = unknown>(
  slug: string,
  params: Record<string, unknown>,
  onProgress?: ProgressCallback,
): Promise<T> {
  const pyodide = await getPyodide(onProgress);
  const moduleName = slug.replace(/-/g, "_");

  if (!moduleCache.has(moduleName)) {
    onProgress?.(`Cargando script ${moduleName}.py…`);
    const res = await fetch(`/python_models/${moduleName}.py`, {
      cache: "no-cache",
    });
    if (!res.ok) {
      throw new Error(`No se encontró /python_models/${moduleName}.py`);
    }
    const code = await res.text();
    pyodide.FS.writeFile(`/python_models/${moduleName}.py`, code);
    moduleCache.add(moduleName);
  }

  onProgress?.("Ejecutando modelo…");
  pyodide.globals.set("__params_json", JSON.stringify(params));

  const code = `
import importlib, json
m = importlib.import_module("${moduleName}")
importlib.reload(m)
__result = m.solve(json.loads(__params_json))
json.dumps(__result)
`;

  try {
    const json = pyodide.runPython(code) as string;
    return JSON.parse(json) as T;
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const last = lines[lines.length - 1] ?? raw;
    throw new Error(last);
  }
}
