<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository

- This is one npm package using Next.js 16.3.4 App Router with Supabase SSR integration. Application code starts in `app/`; there is no `src/`, separate application backend, or test suite yet.
- `referencias/pantallas/index.dc.html` indexes the linked product prototypes; `referencias/screenshots/` contains additional visual references. The `.dc.html` files are design inputs, not Next.js routes: implement application behavior under `app/`.
- `referencias/pantallas/support.js` is generated reference-preview code. Do not edit it; its stated source directory, `dc-runtime/`, is not part of this repository.

## Toolchain

- Use npm and keep `package-lock.json` authoritative. The installed Supabase libraries require Node.js 22 or newer.
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
- Supabase MCP is connected to the target hosted project. Use it to inspect the database, apply migrations, generate types, review advisors, and work with Storage or Edge Functions.

## Supabase

- The intended database model is documented in the `docs` project reference at `../07-DB-Schema/opendaycare-database-schema.md`. Treat it as the design source, not proof that the schema has been deployed.
- The connected project currently has no `public` tables, migrations, Storage buckets, or Edge Functions. Inspect the remote project before assuming this remains true.
- The Next.js application uses the pinned `@supabase/supabase-js` and `@supabase/ssr` packages. Browser and server client factories live in `utils/supabase/client.ts` and `utils/supabase/server.ts`.
- Session cookies are refreshed by `utils/supabase/middleware.ts` through the Next.js 16 request entry point in the root `proxy.ts`. Keep the auth validation call and refreshed response cookies/cache-safety headers intact.
- Supabase clients use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; local values belong in ignored environment files. `.env.template` also documents `SUPABASE_DB_PASSWORD`. Never commit passwords, secret keys, or `service_role` credentials, and never expose them through `NEXT_PUBLIC_*` variables.
- No local `supabase/` CLI project is installed yet. Keep `package-lock.json` authoritative when changing packages and pin their versions.
- Persist database identifiers, enum values, tags, and codes in English; translate user-facing labels in the UI. The planned schema uses UUID primary keys and `timestamptz` audit fields.
- Supabase Auth owns credentials in `auth.users`; application profile data belongs in `public.users`. Never duplicate email or password hashes in the domain schema.
- Enable RLS on every table in exposed schemas, including `public`, and write policies for the actual ownership and role model. Never use user-editable `user_metadata` for authorization decisions.
- Use `supabase_apply_migration` for DDL, `supabase_execute_sql` for non-DDL queries, and run Supabase security and performance advisors after schema changes. Do not hardcode generated IDs in data migrations.
- Search current Supabase documentation before implementation or debugging; do not rely on model memory for APIs, CLI flags, authentication, or RLS behavior.

## Agents

- `spec-verifier`: run it after implementing a spec and before changing its status to `Implementado`. It verifies every acceptance criterion against real evidence, fixes in-scope defects, and updates the checkboxes only for criteria it could prove.
- The agent is defined twice and both copies must be kept in sync when the workflow changes: `.claude/agents/spec-verifier.md` for Claude Code (invoke it with `@agent-spec-verifier <spec path>`) and `.opencode/agents/spec-verifier.md` for OpenCode. The frontmatter and the browser-approval mechanism differ by design; the workflow must not.
- Browser verification is optional. In Claude Code each Playwright call raises a permission prompt in the main session, so the agent announces its browser plan first and leaves criteria that need browser evidence unchecked when a call is denied.

## Skills

- `/spec`: load `spec` to create or refine feature and screen specifications before implementing large work.
- `/spec-impl`: load `spec-impl` only for an approved specification; it manages the implementation branch and staged review workflow.
- Store every database-related specification under `specs/database/`.
- `supabase`: load for every task involving Supabase Database, Auth, Storage, Realtime, Edge Functions, client libraries, CLI, MCP, logs, or troubleshooting.
- `supabase-postgres-best-practices`: load before writing or changing SQL, tables, columns, indexes, migrations, RLS policies, triggers, database functions, or when diagnosing Postgres performance and concurrency issues. For database work, load it together with `supabase`.

## Code Rules

- Use clean code and English names for functions, variables, types, database objects, and persisted values.
