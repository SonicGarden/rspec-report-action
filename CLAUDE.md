# CLAUDE.md

GitHub Action (zero-dependency composite action) that reports RSpec failures as a Job Summary and/or PR comment.

## Commands

```bash
node --test   # run all tests (Node >= 22, no install step)
```

Release: run the `release` workflow manually (Actions → release → Run workflow) on `main`, choosing `major` / `minor` / `patch`. It computes the next `vX.Y.Z` from the latest tag, creates the tag and Release (auto-generated notes), and moves the major tag `vX` (creating its empty Release on first use).

There is no build, bundle, or `dist/`; `action.yml` runs `report.mjs` directly with the runner's `node`.

## Gotchas

- **No dependencies, no package.json.** Use only Node built-ins in `report.mjs`.
- **Tests resolve fixtures via `GITHUB_WORKSPACE`.** Fixtures are `.dummy_results-*.json`.
- **PR comments are not posted by `report.mjs`.** It writes comment bodies to files; `marocchino/sticky-pull-request-comment` (pinned SHA) posts them with headers `rspec-report-failure` / `rspec-report-profile`. Dependabot runs need `permissions: pull-requests: write`.
- **Workflow actions are locked** in `.github/workflows/actions.lock`; after changing any `uses:` (workflows or `action.yml`), run `gh actions-lock --no-narrow` and `gh actions-lock --verify`. `--no-narrow` keeps the SHA pins in `action.yml` (consumers without a lockfile rely on them); plain `gh actions-lock` would rewrite them to tags. The test job uses `uses: $/` so the lock tool can follow `action.yml`.
- **Code comments are written in English** — match this convention.
- **Commit messages, PR titles, and PR bodies are written in English**, even when conversing in Japanese.
- Node major version `26` is set in `mise.toml` (local) and `.github/workflows/test.yml` (CI); keep them in sync.

## Architecture

- `report.mjs` — single file: parses RSpec JSON file(s) (glob-supported), merges examples, builds failure Markdown (copy-friendly code block of `path:line description` plus one `<details>` block, capped at 20 items) and the slowest-examples table, writes the Job Summary, and writes comment bodies to files. Project-local backtrace lines are kept; gem/Ruby internals dropped.
- `action.yml` — composite action: runs `report.mjs`, then sticky comment steps (failure comment removed on success). Inputs are defined here.
- `test/report.test.mjs` — `node:test` tests.
