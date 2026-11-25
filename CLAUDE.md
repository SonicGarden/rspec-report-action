# CLAUDE.md

GitHub Action (zero-dependency composite action) that reports RSpec failures as a Job Summary and/or PR comment.

## Commands

```bash
node --test   # run all tests (Node >= 22, no install step)
```

There is no build, bundle, or `dist/`; `action.yml` runs `report.mjs` directly with the runner's `node`.

## Gotchas

- **No dependencies, no package.json.** Use only Node built-ins in `report.mjs`.
- **Tests resolve fixtures via `GITHUB_WORKSPACE`.** Fixtures are `.dummy_results-*.json`.
- **PR comments are not posted by `report.mjs`.** It writes comment bodies to files; `marocchino/sticky-pull-request-comment` (pinned SHA) posts them with headers `rspec-report-failure` / `rspec-report-profile`. Dependabot runs need `permissions: pull-requests: write`.
- **Workflow actions are locked** in `.github/workflows/actions.lock`; after changing any `uses:` (workflows or `action.yml`), run `gh actions-lock --no-narrow` and `gh actions-lock --verify`. `--no-narrow` keeps the SHA pins in `action.yml` (consumers without a lockfile rely on them); plain `gh actions-lock` would rewrite them to tags. The test job uses `uses: $/` so the lock tool can follow `action.yml`.
- **Code comments are written in English** — match this convention.
- **Commit messages, PR titles, and PR bodies are written in English**, even when conversing in Japanese.
- Node version pinned in `.node-version` and `mise.toml`.

## Architecture

- `report.mjs` — single file: parses RSpec JSON file(s) (glob-supported), merges examples, builds failure Markdown (copy-friendly code block of `path:line description` plus one `<details>` block, capped at 20 items) and the slowest-examples table, writes the Job Summary, and writes comment bodies to files. Project-local backtrace lines are kept; gem/Ruby internals dropped.
- `action.yml` — composite action: runs `report.mjs`, then sticky comment steps (failure comment removed on success). Inputs are defined here.
- `test/report.test.mjs` — `node:test` tests.
