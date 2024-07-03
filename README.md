# RSpec Report

A GitHub Action that report RSpec failure.

## Usage:

Reported in Job Summary.

![Demo](https://i.gyazo.com/f1367e662dbdca161e3fa8e503fb8fb3.png)

### Inputs

See [action.yml](action.yml)

| Name | Description | Default | Required |
| - | - | - | - |
| `json-path` | Path to RSpec result json file. (Support for glob pattern) | | yes |
| `token` | GITHUB_TOKEN | `${{ github.token }}` | no |
| `title` | Summary title | `# :cold_sweat: RSpec failure` | no |
| `hideFooterLink` | Hide footer link | `false` | no |
| `comment` | Set this if want to comment report to pull request | `true` | no |
| `pull-request-id` | ID of the pull request to comment the report on | | no |

## Example

```yaml
name: Build
on:
  pull_request:

jobs:
  rspec:
    steps:
      # setup...

      - name: Test
        run: bundle exec rspec -f j -o tmp/rspec_results.json -f p

      - name: RSpec Report
        uses: SonicGarden/rspec-report-action@v5
        with:
          json-path: tmp/rspec_results.json
        if: always()
```

## Parallel Test Example
```yaml
name: Build
on:
  pull_request:

jobs:
  rspec:
    strategy:
      fail-fast: false
      matrix:
        ci_node_index: [0, 1]
        ci_node_total: [2]
    steps:
      # setup...

      # Recommend using `r7kamura/split-tests-by-timings`.
      - id: split-tests
        run: |
          PATHS=$(
            find spec -type f -name '*_spec.rb' | \
              xargs wc -l | \
              head -n -1 | \
              sort -n | \
              awk -v node=${{ matrix.ci_node_index }} -v total=${{ matrix.ci_node_total }} 'NR % total == node {print $2}' | \
              tr '\n' ' '
          )
          echo "paths=$PATHS" >> "$GITHUB_OUTPUT"
        shell: bash

      - name: Test
        run: |
          bundle exec rspec \
            -f j -o tmp/json-reports/rspec_results-${{ matrix.ci_node_index }}.json \
            -f p \
            ${{ steps.split-tests.outputs.paths }}
      - uses: actions/upload-artifact@v4
        with:
          if-no-files-found: error
          name: json-reports-${{ matrix.ci_node_index }}
          path: tmp/json-reports
        if: always()

  report-rspec:
    needs: rspec
    if: always()
    steps:
      - name: Download all rspec results
        uses: actions/download-artifact@v4
        with:
          pattern: json-reports-*
          path: /tmp/json-reports
          merge-multiple: true
      - name: RSpec Report
        uses: SonicGarden/rspec-report-action@v5
        with:
          json-path: /tmp/json-reports/rspec_results-*.json
```

## Push Event Test
```yaml
name: Build
on:
  push:

jobs:
  rspec:
    steps:
      # setup...

      - name: Test
        continue-on-error: true
        run: bundle exec rspec -f j -o tmp/rspec_results.json -f p

      - name: Find open or draft PR associated with commit and branch
        id: find_pr
        continue-on-error: true
        run: |
          pr_json=$(gh pr list --state open --head "${{ github.ref_name }}" --json number,commits --jq '.[] | select(.commits | any(.oid == "${{ github.sha }}")) | {number: .number}')
          if [ -z "$pr_json" ]; then
            echo "No open or draft PR found for commit SHA: ${{ github.sha }} on branch: ${{ github.ref_name }}"
            exit 1
          else
            echo "pr_json=$pr_json" >> "$GITHUB_OUTPUT"
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: RSpec Report
        if: steps.find_pr.outcome == 'success'
        uses: SonicGarden/rspec-report-action@v5
        with:
          json-path: tmp/rspec_results.json
          pull-request-id: ${{ fromJson(steps.find_pr.outputs.pr_json).number }}
```
