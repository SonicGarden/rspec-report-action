# RSpec Report

A GitHub Action that report RSpec failure.

![Demo](https://i.gyazo.com/29402af7cc01eaac256bb54a3ebe8049.png)

## Usage:

The action works only with `pull_request` event.

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
        uses: SonicGarden/rspec-report-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          json-path: tmp/rspec_results.json
        if: failure()
```
