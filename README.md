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
      - name: Test
        run: bundle exec rspec -f j -o tmp/rspec_results.json -f p

      - name: RSpec Report
        uses: SonicGarden/rspec-report-action@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          json-path: tmp/rspec_results.json
        if: always()
```
