# CLAUDE.md

GitHub Action (TypeScript, ESM) that reports RSpec failures as a Job Summary and/or PR comment.

## Commands

```bash
pnpm install
pnpm run all      # full gate: build (tsc --noEmit) → format-check → lint → package → test
pnpm test         # jest (ts-jest, ESM)
pnpm run package  # rollup bundle into dist/ — REQUIRED before committing src/ changes
```

`pnpm run build` is type-check only (`tsc --noEmit`); it does not emit. The shipped artifact is built by `package`.

## Gotchas

- **`dist/` is committed and must be rebuilt.** `action.yml` runs `dist/index.js`. After any `src/` change, run `pnpm run package` and commit `dist/`, or the action ships stale code.
- **ESM imports use `.js` specifiers** even though sources are `.ts` (e.g. `import { parse } from './parse.js'`). `ts-jest-resolver` maps these in tests.
- **Tests resolve fixtures via `GITHUB_WORKSPACE`.** `parse.ts` reads paths relative to `process.env.GITHUB_WORKSPACE`; fixtures are `.dummy_results-*.json`.
- **Code comments are written in English** — match this convention.
- Node 24 / pnpm 10, pinned in `.node-version` and `mise.toml`.

## Architecture

Pipeline driven by `src/main.ts`:

- `parse.ts` — reads RSpec JSON file(s) (glob-supported), merges examples, returns `RspecResult` (failures, slow examples, summary, totalTime). `extractProjectBacktrace` keeps project-local backtrace lines and drops gem/Ruby internals.
- `format.ts` — builds the failure Markdown: a copy-friendly code block listing `path:line description`, plus a single `<details>` block with linked headings, raw message, and backtrace. Capped at `MAX_LIST_ITEMS` (20); overflow shown as `... and N more failures`.
- `report-summary.ts` — writes the GitHub Job Summary (`core.summary`).
- `report-comment.ts` — upserts the failure PR comment (deletes it on success).
- `profile-comment.ts` — separate PR comment with the slowest-examples table.

Inputs are defined in `action.yml`.
