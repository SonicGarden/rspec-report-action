# RSpec Report

A GitHub Action that report RSpec failure.

## Usage:

Reported in Job Summary.

![Demo](https://i.gyazo.com/f1367e662dbdca161e3fa8e503fb8fb3.png)

### Inputs

- `token` - The GITHUB_TOKEN secret.
- `json-path` - Path to RSpec result json file.

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
        uses: SonicGarden/rspec-report-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
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
        uses: SonicGarden/rspec-report-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          json-path: /tmp/json-reports/rspec_results-*.json
```
