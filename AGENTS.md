<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository

- This is one npm package using Next.js 16.3.4 App Router. Application code starts in `app/`; there is no `src/`, backend, database, or test suite yet.
- `referencias/pantallas/index.dc.html` indexes the linked product prototypes; `referencias/screenshots/` contains additional visual references. The `.dc.html` files are design inputs, not Next.js routes: implement application behavior under `app/`.
- `referencias/pantallas/support.js` is generated reference-preview code. Do not edit it; its stated source directory, `dc-runtime/`, is not part of this repository.

## Toolchain

- Use npm and keep `package-lock.json` authoritative. Next.js requires Node.js 20.9 or newer.
- Tailwind CSS is v4 and is loaded with `@import "tailwindcss"` in `app/globals.css` through `@tailwindcss/postcss`; there is intentionally no `tailwind.config.*`.
- TypeScript is strict and maps `@/*` to the repository root. Next.js-generated types live in `.next/types` and `.next/dev/types`; do not edit them or the ignored `next-env.d.ts`.

## Commands

- Install reproducibly: `npm ci`.
- Develop: `npm run dev` (http://localhost:3000).
- Lint application code: `npm run lint -- app`; lint one file: `npm run lint -- app/page.tsx`.
- Bare `npm run lint` also scans generated `referencias/pantallas/support.js` and currently fails there. Do not edit that generated file to satisfy lint.
- Type-check: `npx tsc --noEmit`.
- Production verification: `npm run build`.
- No test command is configured. Do not report tests as passing unless a test runner is added.

## Tools

- Playwright: screenshots and any Playwright output go in `.playwright-mcp/` (gitignored).
- Context7: use it to fetch current framework docs instead of relying on training data.

## Spec Driven Development - Skills

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones
.
## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc. en inglés.
