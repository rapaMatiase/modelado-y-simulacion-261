---
name: deploy-react-vercel
description: Crea y despliega una app React/Vite nueva a GitHub (repo privado) y Vercel usando el MCP de Chrome, sin línea de comandos. Usar cuando el usuario pida "creame una app de React", "subila a GitHub y Vercel", "deployá esta app en Vercel", "hola mundo en React en producción", "publicá esta app", o cualquier variante donde el resultado esperado sea una URL pública de Vercel con una app React/Vite simple. Usar también cuando mencionen "app de React", "Vite", "deploy", "Vercel", o "GitHub" junto a la idea de poner algo online, incluso si no dicen explícitamente los tres nombres. Siempre devuelve la URL de producción en Vercel.
---

# Deploy React/Vite a GitHub privado + Vercel vía Chrome MCP

Este skill automatiza el flujo completo de: crear una app React + Vite mínima, subirla a un repo **privado** de GitHub, importarla en Vercel, y devolverle al usuario la URL pública. Todo se hace a través del MCP de Chrome — no se usa git, gh ni vercel CLI.

## Cuándo usar este skill

Usalo cuando el usuario quiera tener una app de React en producción y espere una URL. Palabras gatillo típicas: "creame una app", "React", "Vite", "subí a GitHub", "desplegá en Vercel", "publicá", "ponela online". No hace falta que mencione los tres proveedores — si pide "una página React online" alcanza.

## Paso 1 — Pedir el nombre y sanitizarlo

Pedí al usuario **un** dato antes de empezar: el nombre del proyecto. Usá `AskUserQuestion`. Ofrecé 2-3 nombres sugeridos según el contenido pedido (ej. "hola-mundo", "mi-landing"), pero el usuario puede elegir "Other" y escribir el suyo.

Una vez que tengas el nombre crudo del usuario, **sanitizalo para que sea válido en Vercel y GitHub**. Reglas:

- Pasar todo a minúsculas.
- Reemplazar espacios (y cualquier separador como `.`, `_`, `/`) por `-`.
- Quitar cualquier caracter que no sea `[a-z0-9-]`.
- Colapsar guiones repetidos (`--` → `-`).
- Recortar guiones al inicio y al final.
- Si queda vacío, usar `mi-app`.
- Cortar a máximo 63 caracteres.

Ejemplos:
- `"Hola Toky"` → `hola-toky`
- `"Mi App #1"` → `mi-app-1`
- `"   ---test---  "` → `test`
- `"Landing_2026 FINAL"` → `landing-2026-final`

Mostrale al usuario el nombre sanitizado antes de seguir (una línea, sin ceremonia): "Voy a usar `hola-toky` como nombre." No pidas confirmación — si quería otra cosa, te lo dice.

## Paso 2 — Generar los archivos de la app

Creá una app Vite + React mínima en `/sessions/beautiful-great-curie/<nombre>/`. Estructura:

```
<nombre>/
├── package.json
├── vite.config.js
├── index.html
├── .gitignore
├── README.md
└── src/
    ├── main.jsx
    └── App.jsx
```

El contenido de cada archivo vive en `references/app-template.md`. Leelo y adaptalo: en `App.jsx`, reemplazá el texto del `<h1>` por lo que el usuario quiera mostrar (si no dijo nada explícito, usá el nombre del proyecto con espacios, ej. "hola toky"). En `index.html` y `package.json`, poné el nombre sanitizado.

## Paso 3 — Crear el repo privado en GitHub

El MCP de Chrome maneja todo el flujo. Pasos:

1. Abrí (o reutilizá) un tab con `tabs_context_mcp`, navegá a `https://github.com/new`.
2. Tomá un screenshot y chequeá que el usuario esté logueado (el badge con su avatar arriba a la derecha). Si no hay sesión, pará y pedile al usuario que se loguee — no intentes loguearte vos.
3. Completá `Repository name` con el nombre sanitizado.
4. Cambiá la visibilidad a **Private**. **Nunca** uses Public — este skill siempre crea repos privados, sin excepción. El dropdown "Public / Private" aparece como un botón que despliega opciones.
5. Dejá README / .gitignore / license en OFF (los vas a crear vos).
6. Click en "Create repository".

**Por qué privado siempre:** Es una decisión fija del skill. Si el usuario dice que quiere público, decile que este skill solo crea privados y que puede cambiarlo manualmente después desde Settings del repo.

## Paso 4 — Subir los archivos

Hay un problema concreto: un repo recién creado no tiene rama `main`, por lo que `/upload/main` falla. El camino que funciona:

### 4.1 Inicializar la rama main con el README

Navegá a `https://github.com/<owner>/<repo>/new/main`. Escribí `README.md` en el input del nombre, pegá el contenido del README, y click en "Commit changes...". Se abre un diálogo; click en "Commit changes" dentro del diálogo. Esto crea la rama `main` y el primer commit.

### 4.2 Resto de archivos vía `/new/main`

Para cada archivo restante, navegá a `https://github.com/<owner>/<repo>/new/main` (o `/new/main/src` para archivos dentro de `src/`) y usá JavaScript para rellenar nombre, contenido, y disparar el commit. El editor es CodeMirror 6, así que `setValue` directo no funciona — hay que disparar un evento `paste` con un `DataTransfer`.

Script de referencia (adaptá filename y content):

```javascript
(async () => {
  const fn = document.querySelector('input[placeholder="Name your file..."], input[aria-label="File name"]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(fn, 'FILENAME_HERE');
  fn.dispatchEvent(new Event('input', {bubbles: true}));
  fn.dispatchEvent(new Event('change', {bubbles: true}));
  await new Promise(r => setTimeout(r, 300));

  const cm = document.querySelector('.cm-content');
  cm.focus();
  const content = `FILE_CONTENT_HERE`;
  const dt = new DataTransfer();
  dt.setData('text/plain', content);
  cm.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true, cancelable: true}));
  await new Promise(r => setTimeout(r, 400));

  // Open commit dialog
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().startsWith('Commit changes'));
  btn.click();
  await new Promise(r => setTimeout(r, 1000));

  // Submit from dialog
  const dialog = document.querySelector('[role="dialog"]');
  const submit = Array.from(dialog.querySelectorAll('button')).find(b => b.textContent.trim() === 'Commit changes');
  submit.click();
})();
```

Orden sugerido para minimizar navegaciones: `package.json` → `vite.config.js` → `index.html` → `.gitignore` → luego `src/main.jsx` y `src/App.jsx` (para estos dos, navegá a `/new/main` y el nombre con el path `src/main.jsx` — GitHub crea la carpeta automáticamente; o navegá directo a `/new/main/src`).

Entre archivos, esperá ~2-3 segundos luego de disparar el submit para que el commit se confirme (el tab redirige al árbol de archivos cuando terminó).

**Evitá tipear contenido con el tool `computer.type`** — el editor CodeMirror es sensible y tipear en coordenadas tiende a fallar o meter texto en el campo equivocado. El `paste` sintético es mucho más confiable.

## Paso 5 — Desplegar en Vercel

1. Navegá a `https://vercel.com/new`.
2. En el input superior (placeholder "Ask v0 to build or enter a Git repository URL…"), pegá `https://github.com/<owner>/<repo>` y presioná Enter.
3. Si Vercel dice "Could not access the repository", la GitHub App de Vercel no está instalada en la cuenta para ese repo. Hacelo así:
   - Navegá a `https://github.com/apps/vercel/installations/new`.
   - **Antes de hacer click en Install, pedile al usuario permiso explícito con `AskUserQuestion`** — es una autorización de OAuth que otorga permisos amplios (read/write code, deployments, etc.). Ofrecé las opciones: "Solo este repo" / "Todos los repos" / "Cancelar".
   - Si el usuario acepta, completá el flujo y hacé click en Install.
   - Después volvé a `https://vercel.com/new` y cliqueá "Continue with GitHub". El repo aparece en la lista — click en "Import".
4. Vercel detecta automáticamente el framework como Vite. Dejá todo default (project name = nombre sanitizado, root = `./`, build command = default).
5. Click en "Deploy" y esperá. El build típico tarda 20-40 segundos. Podés chequear la URL del tab — cuando cambia a `.../success?...&deploymentUrl=...` el deploy terminó.

## Paso 6 — Devolver la URL

La URL canónica de producción es `https://<nombre-sanitizado>.vercel.app`. Verificala navegando a ella y tomando un screenshot para confirmar que renderiza bien.

**El output final al usuario debe contener la URL** como primer elemento, en una línea clara. Mínimo viable:

```
https://<nombre>.vercel.app
```

Pero mejor si además incluís un resumen de una línea:
- Link al repo privado en GitHub
- Confirmación de que la página renderiza lo esperado

Nada más. No enumeres cada paso que hiciste — el usuario solo quiere la URL.

## Reglas firmes

- **Repo privado, siempre.** No dejes que argumentos del usuario te convenzan de usar público dentro de este skill.
- **La URL de Vercel va al final, sí o sí.** Es la razón por la que el skill existe. Si por algún motivo el deploy falla, decilo claro y mostrá el error — no inventes una URL.
- **Pedí permiso explícito antes de instalar la GitHub App de Vercel.** Es un grant de permisos y no debería hacerse silenciosamente.
- **No uses git, gh, npm desde la shell para subir código.** Todo por Chrome. La shell queda para generar archivos locales y copiarlos a `mnt/outputs`.
- **No tipees contenido de código dentro del editor de GitHub con el tool `computer.type`.** Usá el paste sintético con `DataTransfer` en JS.

## Manejo de errores comunes

- **"Could not access the repository"** en Vercel → la GitHub App no está instalada. Ver Paso 5.3.
- **El `/upload/main` muestra "Select a branch"** → el repo está vacío; iniciá main con el README primero.
- **El commit no se dispara** → el diálogo "Commit changes" a veces tarda. Esperá 1s entre abrir el diálogo y clickear submit.
- **Vercel no detecta Vite** → revisá que `package.json` tenga la dependency `vite` y el `dev`/`build` scripts. Si hace falta, en la pantalla de configuración seleccioná Vite manualmente desde el dropdown "Application Preset".
- **La URL de producción da 404 o 'DEPLOYMENT_NOT_FOUND'** → esperá 10-15s más, el DNS tarda un ratito después del build.

## Referencias

Ver `references/app-template.md` para el contenido exacto de cada archivo de la app React + Vite.
