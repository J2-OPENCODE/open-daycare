---
name: spec-impl-codex
description: Implements an approved spec by delegating every plan step to Codex. Validates that the state means "Approved" (in any language), creates a git branch named after the spec, and drives Codex step by step with pauses to review diffs.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Agent, Bash(node:*), Bash(ls:*), Bash(cat:*), Bash(npx tsc:*), Bash(npm run lint:*), Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), mcp__supabase__get_advisors
---

# /spec-impl-codex — Implementer of approved specs, driven by Codex

Same workflow as `/spec-impl`, with one difference: **Codex writes the code, you coordinate.**
You identify the spec, validate its state, manage the branch, split the plan into steps, send each step to Codex, show the resulting diff and pause. You never write application code yourself.

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Branch-creation config:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, no config file)"`

Codex companion script:
!`ls -d ~/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs 2>/dev/null | sort -V | tail -1 || echo "NOT FOUND"`

The last line is the path you will use for every Codex call. Call it `$CODEX` in your head and always pass the absolute path in the command. `${CLAUDE_PLUGIN_ROOT}` does **not** resolve here — this skill lives in the repository, not inside the plugin — so never use that variable.

If the path is empty or `NOT FOUND`: stop. Tell the user the Codex plugin is not installed and that they should run `/codex:setup`. Do not create a branch, do not implement anything yourself.

---

## Instructions

Follow these four phases in strict order. **Do not advance to the next phase if the previous one did not complete correctly.**

---

### Phase 1 — Identify the spec

The received argument is: `$ARGUMENTS`

If `$ARGUMENTS` is empty:

- List the files available in `specs/` (you already have them above).
- Ask the user to specify the exact name of the spec.
- Stop and wait for an answer. Do not continue.

If `$ARGUMENTS` has a value:

- Look for the file in `specs/`. The user may have written the full name (`01-mvp-arkanoid`), only the number (`01`), or only the slug (`mvp-arkanoid`). Try to find the correct file in any of those cases.
- If you do not find the file, show the available specs and ask the user to correct the name.
- If you do find it, continue to Phase 2.

---

### Phase 2 — Validate the spec's state

Read the spec file you located in Phase 1 using the Read tool or `cat`.

In the file's contents, look for the line that contains the spec's state. The header label is typically `**Status:**` (English) or `**Estado:**` (Spanish), but it may use any language. Match by position (status line near the top of the spec) and by the surrounding state machine, not by the exact label.

**Absolute rule:** You can only continue if the state **means "Approved"** — regardless of the language used.

Treat any of the following (and their equivalents in other languages) as the **Approved** state and continue:

- English: `Approved`
- Spanish: `Aprobado`
- Portuguese: `Aprovado`
- French: `Approuvé`
- German: `Genehmigt`
- Italian: `Approvato`
- …or any other language's word that clearly means "approved"

Anything else (Draft / Borrador, In review / En revisión, Implemented / Implementado, Obsolete / Obsoleto, or any unrecognized value) means **stop** and show the error message below.

| State category                            | Examples (any language)                           | Action                                                                     |
| ----------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| Approved                                  | `Approved`, `Aprobado`, `Aprovado`, `Approuvé`, … | Continue to Phase 3.                                                       |
| Draft                                     | `Draft`, `Borrador`, …                            | Stop. Show the error message below.                                        |
| In review                                 | `In review`, `En revisión`, …                     | Stop. Show the error message below.                                        |
| Implemented                               | `Implemented`, `Implementado`, …                  | Stop. Show the error message below.                                        |
| Obsolete                                  | `Obsolete`, `Obsoleto`, …                         | Stop. Show the error message below.                                        |
| State line not found / unrecognized value | —                                                 | Stop. The file does not follow the expected format. Tell this to the user. |

If you are unsure whether a value means "approved", **do not assume**. Stop and ask the user to clarify or to update the spec to the canonical wording.

**Standard error message when the state does not mean Approved:**

```
❌ I cannot implement this spec.

Current state: [STATE FOUND]
I only work with specs whose state means "Approved" (e.g. `Approved`, `Aprobado`,
or the equivalent in another language).

To continue you have two options:
  1. If the spec is ready to be implemented, open it and change the state
     to "Approved" (or the equivalent term your team uses) manually.
     That change is made by the human, not the agent.
  2. If the spec still needs work, use /spec [name] to resume it.
```

Do not offer alternatives, do not suggest "I can still start if you want". The block is intentional.

---

### Phase 3 — Check Codex, create the git branch and switch to it

Once you have confirmed the state means `Approved`:

0. **Check Codex before touching git.** Run:

   ```bash
   node "<companion path from the session context>" setup --json
   ```

   - If `ready` is not `true`, or `codex.available` is `false`, or `auth.loggedIn` is `false`: stop. Tell the user to run `/codex:setup`, and if the problem is only authentication, to run `!codex login`. Do not create a branch, do not improvise alternate auth flows, do not fall back to implementing the spec yourself.
   - If everything is ready, say so in one line and continue.

1. **Check the working tree.** Look at the `git status --short` output in the session context above. If it is **not empty**, stop and show the pending changes, then ask:

   ```
   ⚠️ There are uncommitted changes in the working tree.
   Switching branches would carry them over. What do you want to do?
     1. Commit or stash them yourself, then re-run this command  (recommended)
     2. Continue anyway — the changes travel to the new branch
   ```

   Wait for the answer. **Do not stash or commit on the user's behalf** unless they explicitly ask for it. This check matters more here than in `/spec-impl`: a dirty tree makes it impossible to tell which files Codex touched. If the working tree is clean, skip straight to step 2 without mentioning it.

2. Derive the branch name from the spec file's full name, without the extension. Format: `spec-NN-slug`. Examples:

   - `01-mvp-arkanoid.md` → branch `spec-01-mvp-arkanoid`
   - `02-powerups.md` → branch `spec-02-powerups`

3. Read the `AutoCreateBranch` flag from the **Branch-creation config** shown in the session context above.

   - If the config file does not exist, the value is missing, or the value is unrecognized → treat it as `true` (the default).
   - Only an explicit `false` (in any capitalization) disables automatic branch creation.

   **If `AutoCreateBranch` is `true` (default):** proceed without asking.

   - If the branch **does not exist**: create it with `git checkout -b spec-NN-slug`.
   - If it **already exists**: this means previous work is being resumed. Switch to it, read `git log --oneline` on the branch, and tell the user which steps of the plan already look done and which step you propose to resume from. Wait for confirmation on the resume point before sending anything to Codex.
   - In both cases: switch to the branch with `git checkout spec-NN-slug` and confirm the change was successful before continuing.

   **If `AutoCreateBranch` is `false`:** ask before touching git. Show:

   ```
   AutoCreateBranch is set to false.
   Create and switch to the branch spec-NN-slug? [y/N]
   ```

   - If the user answers **yes**: create/switch to the branch exactly as in the `true` case above.
   - If the user answers **no** or leaves it empty: **do not create any branch.** Tell the user Codex will work on the current branch (the one shown in the session context above) and ask for explicit confirmation to continue there. Do not improvise — wait for the answer.

4. Visually confirm to the user the spec is ready and which branch is active:

   ```
   ✅ Ready to implement with Codex.

   Spec:   specs/NN-slug.md
   Branch: spec-NN-slug  (active)   (← or the current branch, if no new branch was created)
   State:  Approved   (← echo back the actual value found in the spec)
   Codex:  codex-cli X.Y.Z, authenticated
   ```

5. **Do not start implementing yet.** First show the spec summary to the user so they have it fresh. Extract and show:
   - The **objective** (the line after `**Objective:**` / `**Objetivo:**` / equivalent label).
   - The **scope** (the `## Scope` / `## Alcance` / equivalent section).
   - The **implementation plan** (the section with the numbered steps — `## Implementation plan` / `## Plan de implementación` / equivalent).
   - The **acceptance criteria** (the checklist — `## Acceptance criteria` / `## Criterios de aceptación` / equivalent).

Match section headings by meaning, not by exact wording — the spec may be authored in any language.

---

### Phase 4 — Delegate the implementation to Codex, step by step

After showing the spec summary, tell the user:

```
Codex will implement the spec following the implementation plan exactly.
One plan step per Codex run. After each step I show you the diff and pause.
I do not write application code myself, and I never commit.

Shall we start with Step 1?
```

Wait for explicit confirmation ("yes", "go ahead", "go", or equivalent). Do not start without it.

#### Loop for each step N of the plan

**1. Write the step prompt.** Use the `Write` tool to create `$TMPDIR/spec-NN-step-N.md` (or the session scratchpad directory). A prompt file avoids shell-quoting problems with long, multi-line text. The prompt must contain:

- The path of the spec file, so Codex can read the full context itself.
- The literal text of step N of the implementation plan.
- The acceptance criteria related to that step.
- The scope limit: implement **only** step N; do not start later steps.
- The repository rules from `AGENTS.md` that apply to the step — npm and `package-lock.json` authoritative, Next.js 16 App Router with the docs in `node_modules/next/dist/docs/`, Tailwind v4 with no config file, strict TypeScript with `@/*` mapped to the repo root, RLS enabled on every table, English identifiers and persisted values, Spanish user-facing labels.
- **The repo skills Codex must load for this step**, named explicitly. Codex discovers the skills on its own, but it only applies one when the prompt names it or the task clearly matches its description, and **skills do not carry across turns**. Even with `--resume-last`, repeat the relevant names in **every** step prompt:
  - `supabase` — any step touching Database, Auth, Storage, Realtime, Edge Functions, the client libraries or the MCP server.
  - `supabase-postgres-best-practices` — any step writing or changing SQL, tables, columns, indexes, migrations, RLS policies, triggers or database functions. For database work, name it together with `supabase`.
  - `next-best-practices` — steps adding or changing routes, layouts, server/client component boundaries, data fetching or route handlers.
  - `next-cache-components` — only steps that touch caching: `use cache`, `cacheLife`, `cacheTag`, PPR.
  - `react-best-practices` — steps that write or refactor components and hooks. In practice, almost every UI step.
  - `composition-patterns` — only when a step reshapes a component's API rather than adding a screen.
  - `tailwind-css-patterns` — steps with non-trivial Tailwind v4 styling.
  - `typescript-advanced-types` — steps with non-trivial typing, such as a shared response shape or a generic helper.
- **The skills Codex must not invoke:** state explicitly that `spec`, `spec-impl` and `spec-impl-codex` are forbidden. They appear in Codex's skill list because `disable-model-invocation` is Claude Code frontmatter that Codex ignores, and invoking one from inside a step re-enters this flow. Say so in the prompt; do not assume Codex will skip them on its own.
- **For steps that touch the database**, add these rules to the prompt:
  - Database specifications live under `specs/database/`.
  - Use the Supabase MCP: `supabase_apply_migration` for DDL, `supabase_execute_sql` for non-DDL queries. Run the security and performance advisors after the schema change.
  - Enable RLS on every table in an exposed schema and write policies for the real ownership and role model. Never use user-editable `user_metadata` for authorization.
  - New public tables ship writable to `authenticated`: **REVOKE before GRANT** in every table migration.
  - Supabase Auth owns credentials in `auth.users`; profile data belongs in `public.users`. Never duplicate email or password hashes in the domain schema.
  - Do not hardcode generated IDs in data migrations. UUID primary keys, `timestamptz` audit fields, English identifiers and persisted values.
- **The verification commands that actually exist in this repo**, so Codex does not invent any:
  - Type-check with `npx tsc --noEmit`.
  - Lint with `npm run lint -- app` (or a single file: `npm run lint -- app/page.tsx`). Bare `npm run lint` also scans the generated `referencias/pantallas/support.js` and currently fails there — **do not edit that generated file to satisfy lint.**
  - `npm run build` for production verification.
  - **There is no test runner configured.** Do not run `npm test`, and never report tests as passing.
- The explicit instruction: **do not commit, do not create branches, do not push.** Leave every change in the working tree.
- The expected report: which files were touched, what was done, and any assumption made.

**2. Run Codex.** Exactly one call per step:

```bash
node "<companion path>" task --write --cwd "<repository root>" --prompt-file "<prompt file>"
```

- Do not add `--model` or `--effort` unless the user explicitly asks for a model or a reasoning effort. If they ask for `spark`, map it to `--model gpt-5.3-codex-spark`.
- **Step 1:** always a fresh run.
- **Steps 2..N:** keep the Codex thread so it remembers the previous steps. First check:

  ```bash
  node "<companion path>" task-resume-candidate --json
  ```

  If it reports `available: true`, add `--resume-last` to the `task` call. If it reports `available: false`, run fresh. If a resumed run fails, retry once as a fresh run with the same prompt file, and say that you did.
- Foreground by default. Only if the user asks for background, launch the same command with `run_in_background: true` and point them to `/codex:status`; do not poll it yourself in the same turn.

**3. Present Codex's output verbatim.** Do not paraphrase, summarize, shorten or rewrite it. Reproduce its structure as it came: verdict, summary, findings, touched files, next steps. Use the file paths and line numbers exactly as reported. Keep Codex's own distinction between facts, inferences and open questions. Anything of your own — the diff summary, the verification results, your scope observations — goes **after** Codex's output, in a clearly separated section of your own.

**4. Show the real diff.** Run `git status --short` and `git diff --stat` and show them. That is the ground truth of what changed, not Codex's narrative.

**4b. Verify the step yourself.** Do not rely on Codex's claim that it verified.

- If the step touched TypeScript or TSX, run `npx tsc --noEmit`.
- If the step touched files under `app/`, run `npm run lint -- app`.
- If the step touched the database, run the Supabase security and performance advisors.

Report the result plainly, **including failures**, with the shortest decisive line of the error. Do not fix the code yourself: report the failure and let the user decide whether to re-dispatch the step to Codex. Never run bare `npm run lint` (it fails on the generated `referencias/pantallas/support.js`) and never run `npm test` (no test runner is configured).

**5. Pause.** Say:

```
Step N done by Codex. Review the diff and tell me whether I continue with Step N+1.
```

Wait for confirmation before continuing.

#### Fixed rules for the whole phase

**Never commit.** Not per step, not at the end. You write nothing to git history; committing is the user's decision and the user's command. Only commit if they explicitly ask you to.

**You do not write application code.** If Codex fails, times out, or returns an incomplete run, report the failure with the most actionable stderr lines and stop. Do not turn a failed Codex run into a Claude-side implementation attempt. If Codex was never successfully invoked, do not produce a substitute answer at all.

**One rule above all:** the spec is the contract. If something in the spec looks suboptimal to you, mention it as an observation but let Codex implement what was agreed. Changes to the spec go into the spec, not into the code by surprise.

**If the diff goes outside the step's scope:** point out the extra files, show them to the user, and ask whether to keep them or revert them before continuing. Do not silently accept scope creep.

**If Codex reports an ambiguity, or you find one the spec does not resolve:**

- Stop.
- Describe the ambiguity exactly.
- Present two or three concrete options.
- Wait for the user's decision.
- Do not improvise, and do not let the next Codex run guess.

**If the user asks for something out of the spec's scope:**

- Remind them that it is out of this spec's scope.
- Suggest noting it down for the next spec.
- Do not send it to Codex on this branch.

**When finishing the last step:**

```
✅ All steps of the plan are implemented by Codex.

Next step: verify the spec's acceptance criteria one by one with the
spec-verifier agent. Only once they all pass should the spec's state change to
"Implemented" (or the equivalent in your repo's language), followed by the final
commit before merging this branch.
```

Then use `AskUserQuestion` to ask whether to run the verification now, with these two options:

- **Run it now** — launch the `spec-verifier` agent, passing it the path of the spec just implemented (`specs/NN-slug.md`) and the branch it was implemented on. Relay its final report to the user.
- **Run it later** — do not launch anything. Remind the user that they can start it whenever they want with `@agent-spec-verifier specs/NN-slug.md`.

Do not change the spec's state and do not commit in either case. Both remain the user's decision.

---

## Summary of expected behavior

```
/spec-impl-codex 01-mvp-arkanoid

  Phase 1  →  Finds specs/01-mvp-arkanoid.md
  Phase 2  →  Reads the state → "Approved" (or "Aprobado", etc.) → ✅ continues
  Phase 3  →  codex-companion setup --json → ready
              git checkout -b spec-01-mvp-arkanoid
              Shows objective, scope, plan and criteria
  Phase 4  →  Step 1: prompt file (skills named, verification commands) →
              task --write → output verbatim → diff → tsc/lint → pause
              Step 2..N: task --write --resume-last → same rhythm
              Ends by asking whether to run the spec-verifier agent now or later

/spec-impl-codex 02-powerups  (state: Draft / Borrador)

  Phase 1  →  Finds specs/02-powerups.md
  Phase 2  →  Reads the state → "Draft" → ❌ stops
              Shows the standard error message
              Does not create branch, does not call Codex

/spec-impl-codex 03-scores  (Codex not authenticated)

  Phase 1  →  Finds specs/03-scores.md
  Phase 2  →  State "Approved" → ✅ continues
  Phase 3  →  setup --json reports loggedIn: false → ❌ stops
              Tells the user to run /codex:setup or !codex login
              Does not create branch, does not implement anything itself
```

**Branch creation is controlled by the `AutoCreateBranch` flag** in `specs/.spec-config.yml`. It defaults to `true` (create the branch automatically, as shown above). Set it to `false` to make Phase 3 ask `[y/N]` before creating the branch.

**Difference from `/spec-impl`:** `/spec-impl` has Claude write the code. `/spec-impl-codex` has Codex write it while Claude coordinates. Phases 1-3 are identical except for the Codex readiness check. Both end with the same `spec-verifier` handoff, and neither one commits.
