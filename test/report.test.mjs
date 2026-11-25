import { after, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  buildBaseUrl,
  extractProjectBacktrace,
  formatFailureList,
  globFiles,
  markdownTable,
  parse
} from '../report.mjs'

const root = path.resolve(import.meta.dirname, '..')
const script = path.join(root, 'report.mjs')

const countOf = (text, re) => text.match(re)?.length ?? 0

describe('parse', () => {
  test('parses rspec result json', () => {
    const result = parse([path.join(root, '.dummy_results-0.json')], root)
    assert.deepEqual(result, {
      summary: '10 examples, 3 failures',
      examples: [
        {
          filePath: 'spec/models/user_spec.rb',
          lineNumber: 18,
          description:
            'User validations is expected to validate that :email cannot be empty',
          message: '\nexpected: true\n     got: false\n\n(compared using ==)',
          backtrace: [
            "./spec/models/user_spec.rb:18:in `block (3 levels) in <top (required)>'",
            "./app/models/user.rb:24:in `valid?'"
          ]
        },
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 42,
          description:
            'PaymentService#charge raises an error when the gateway is unreachable',
          message:
            'Payment gateway returned an unexpected response.\n\nThe gateway responded with HTTP 502 (Bad Gateway) while attempting to\nauthorize the charge. This usually means the upstream processor is\ntemporarily unavailable. Retrying the request did not resolve the issue\nwithin the configured timeout of 30 seconds.\n\nRequest ID: req_0123456789abcdef',
          backtrace: [
            "./spec/services/payment_service_spec.rb:42:in `block (2 levels) in <top (required)>'",
            "./app/services/payment_service.rb:58:in `charge'",
            "./lib/gateways/stripe_gateway.rb:31:in `authorize'"
          ]
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 73,
          description: 'GET /orders calculates the total amount',
          message: "undefined method `total_amount' for nil:NilClass",
          backtrace: [
            "./spec/requests/orders_spec.rb:73:in `block (2 levels) in <top (required)>'",
            "./app/controllers/orders_controller.rb:19:in `index'"
          ]
        }
      ],
      success: false,
      totalTime: 0.647017,
      slowExamples: [
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 42,
          description:
            'PaymentService#charge raises an error when the gateway is unreachable',
          runTime: 0.156789
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 73,
          description: 'GET /orders calculates the total amount',
          runTime: 0.123456
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 12,
          description: 'GET /orders returns a list of orders',
          runTime: 0.098765
        },
        {
          filePath: 'spec/models/user_spec.rb',
          lineNumber: 18,
          description:
            'User validations is expected to validate that :email cannot be empty',
          runTime: 0.087654
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 89,
          description: 'GET /orders requires authentication',
          runTime: 0.056789
        },
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 67,
          description: 'PaymentService#charge records the transaction',
          runTime: 0.045678
        },
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 21,
          description: 'PaymentService#charge charges the customer',
          runTime: 0.034567
        },
        {
          filePath: 'spec/models/user_spec.rb',
          lineNumber: 31,
          description: 'User callbacks downcases the email before saving',
          runTime: 0.021098
        },
        {
          filePath: 'spec/models/user_spec.rb',
          lineNumber: 8,
          description: 'User with valid attributes is expected to be valid',
          runTime: 0.012345
        },
        {
          filePath: 'spec/models/order_spec.rb',
          lineNumber: 6,
          description: 'Order associations belongs to a user',
          runTime: 0.009876
        }
      ]
    })
  })

  test('merges multiple rspec json results matched by a glob', () => {
    const jsonPaths = globFiles(path.join(root, '.dummy_results-*.json'), root)
    const result = parse(jsonPaths, root)
    assert.deepEqual(result, {
      examples: [
        {
          filePath: 'spec/models/user_spec.rb',
          lineNumber: 18,
          description:
            'User validations is expected to validate that :email cannot be empty',
          message: '\nexpected: true\n     got: false\n\n(compared using ==)',
          backtrace: [
            "./spec/models/user_spec.rb:18:in `block (3 levels) in <top (required)>'",
            "./app/models/user.rb:24:in `valid?'"
          ]
        },
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 42,
          description:
            'PaymentService#charge raises an error when the gateway is unreachable',
          message:
            'Payment gateway returned an unexpected response.\n\nThe gateway responded with HTTP 502 (Bad Gateway) while attempting to\nauthorize the charge. This usually means the upstream processor is\ntemporarily unavailable. Retrying the request did not resolve the issue\nwithin the configured timeout of 30 seconds.\n\nRequest ID: req_0123456789abcdef',
          backtrace: [
            "./spec/services/payment_service_spec.rb:42:in `block (2 levels) in <top (required)>'",
            "./app/services/payment_service.rb:58:in `charge'",
            "./lib/gateways/stripe_gateway.rb:31:in `authorize'"
          ]
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 73,
          description: 'GET /orders calculates the total amount',
          message: "undefined method `total_amount' for nil:NilClass",
          backtrace: [
            "./spec/requests/orders_spec.rb:73:in `block (2 levels) in <top (required)>'",
            "./app/controllers/orders_controller.rb:19:in `index'"
          ]
        }
      ],
      success: false,
      summary: '12 examples, 3 failures, 1 pending',
      totalTime: 0.7077779999999999,
      slowExamples: [
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 42,
          description:
            'PaymentService#charge raises an error when the gateway is unreachable',
          runTime: 0.156789
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 73,
          description: 'GET /orders calculates the total amount',
          runTime: 0.123456
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 12,
          description: 'GET /orders returns a list of orders',
          runTime: 0.098765
        },
        {
          filePath: 'spec/models/user_spec.rb',
          lineNumber: 18,
          description:
            'User validations is expected to validate that :email cannot be empty',
          runTime: 0.087654
        },
        {
          filePath: 'spec/requests/orders_spec.rb',
          lineNumber: 89,
          description: 'GET /orders requires authentication',
          runTime: 0.056789
        },
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 67,
          description: 'PaymentService#charge records the transaction',
          runTime: 0.045678
        },
        {
          filePath: 'spec/activestorage/validator/blob_spec.rb',
          lineNumber: 11,
          description:
            'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq true',
          runTime: 0.044519
        },
        {
          filePath: 'spec/services/payment_service_spec.rb',
          lineNumber: 21,
          description: 'PaymentService#charge charges the customer',
          runTime: 0.034567
        },
        {
          filePath: 'spec/models/user_spec.rb',
          lineNumber: 31,
          description: 'User callbacks downcases the email before saving',
          runTime: 0.021098
        },
        {
          filePath: 'spec/activestorage/validator/blob_spec.rb',
          lineNumber: 10,
          description:
            'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq false',
          runTime: 0.016242
        }
      ]
    })
  })
})

describe('extractProjectBacktrace', () => {
  test('falls back to non-gem lines when no relative paths exist', () => {
    assert.deepEqual(
      extractProjectBacktrace([
        '/usr/local/bundle/gems/rspec-core/lib/x.rb:1',
        '/home/runner/work/app/app/models/a.rb:3',
        '/usr/lib/ruby/3.3.0/z.rb:2'
      ]),
      ['/home/runner/work/app/app/models/a.rb:3']
    )
  })
})

describe('globFiles', () => {
  test('matches dotfiles with relative and absolute patterns', () => {
    const expected = ['.dummy_results-0.json', '.dummy_results-1.json']
    assert.deepEqual(globFiles('.dummy_results-*.json', root), expected)
    assert.deepEqual(
      globFiles('*.json', root).filter((f) => f.startsWith('.dummy')),
      expected
    )
    assert.deepEqual(
      globFiles(path.join(root, '.dummy_results-*.json'), root),
      expected.map((f) => path.join(root, f))
    )
  })

  test('ignores directories and missing paths', () => {
    assert.deepEqual(globFiles('test', root), [])
    assert.deepEqual(globFiles('nope/*.json', root), [])
  })
})

describe('buildBaseUrl', () => {
  test('builds blob base url from github env', () => {
    assert.equal(
      buildBaseUrl({
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_SHA: 'abc123'
      }),
      'https://github.com/owner/repo/blob/abc123'
    )
  })
})

describe('formatFailureList', () => {
  const baseUrl = 'https://github.com/owner/repo/blob/abc123'
  const example = (overrides = {}) => ({
    filePath: 'spec/models/foo_spec.rb',
    lineNumber: 18,
    description: 'Foo is expected to be valid',
    message: 'expected true\n     got: false',
    backtrace: ["./spec/models/foo_spec.rb:18:in 'block (4 levels) in <main>'"],
    ...overrides
  })

  test('keeps the message unprocessed (trimmed, newlines intact, no &nbsp;)', () => {
    const result = formatFailureList(
      [
        example({
          message: '\nexpected: true\n     got: false\n\n(compared using ==)'
        })
      ],
      baseUrl
    )
    assert.ok(
      result.includes('expected: true\n     got: false\n\n(compared using ==)')
    )
    assert.ok(!result.includes('&nbsp;'))
  })

  test('renders a plain list line and a single details with linked heading and merged message/backtrace', () => {
    const result = formatFailureList([example()], baseUrl)
    assert.ok(
      result.includes('spec/models/foo_spec.rb:18 Foo is expected to be valid')
    )
    assert.equal(countOf(result, /<details>/g), 1)
    assert.ok(result.includes('<details><summary>Details</summary>'))
    assert.ok(
      result.includes(
        `### [spec/models/foo_spec.rb:18](${baseUrl}/spec/models/foo_spec.rb#L18) Foo is expected to be valid`
      )
    )
    assert.ok(
      result.includes(
        "expected true\n     got: false\n\n./spec/models/foo_spec.rb:18:in 'block (4 levels) in <main>'"
      )
    )
  })

  test('keeps message and backtrace in a single code block (no extra block when backtrace empty)', () => {
    const withBacktrace = formatFailureList([example()], baseUrl)
    const withoutBacktrace = formatFailureList(
      [example({ backtrace: [] })],
      baseUrl
    )
    assert.ok(withoutBacktrace.includes('expected true\n     got: false'))
    assert.equal(countOf(withBacktrace, /```/g), 4)
    assert.equal(countOf(withoutBacktrace, /```/g), 4)
  })

  test('caps the list at the limit and reports the remaining count', () => {
    const examples = Array.from({ length: 23 }, (_, i) =>
      example({ lineNumber: i + 1 })
    )
    const result = formatFailureList(examples, baseUrl, 20)
    assert.ok(result.includes('... and 3 more failures'))
    assert.equal(countOf(result, /<details>/g), 1)
    assert.equal(countOf(result, /### \[/g), 20)
  })

  test('does not add the more-failures line within the limit', () => {
    const result = formatFailureList(
      [example(), example({ lineNumber: 19 })],
      baseUrl,
      20
    )
    assert.ok(!result.includes('more failures'))
  })
})

describe('markdownTable', () => {
  test('pads cells to the column width like markdown-table', () => {
    assert.equal(
      markdownTable([
        ['Example', 'Description', 'Time in seconds'],
        ['a_spec.rb:1', 'x', '0.1']
      ]),
      [
        '| Example     | Description | Time in seconds |',
        '| ----------- | ----------- | --------------- |',
        '| a_spec.rb:1 | x           | 0.1             |'
      ].join('\n')
    )
  })
})

describe('run', () => {
  const runScript = (env) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rspec-report-test-'))
    after(() => fs.rmSync(dir, { recursive: true, force: true }))
    const files = {
      summary: path.join(dir, 'summary.md'),
      output: path.join(dir, 'output'),
      event: path.join(dir, 'event.json')
    }
    fs.writeFileSync(files.summary, '')
    fs.writeFileSync(files.output, '')
    fs.writeFileSync(
      files.event,
      JSON.stringify({ pull_request: { number: 42 } })
    )
    const proc = spawnSync(process.execPath, [script], {
      cwd: root,
      encoding: 'utf-8',
      env: {
        PATH: process.env.PATH,
        GITHUB_WORKSPACE: root,
        GITHUB_STEP_SUMMARY: files.summary,
        GITHUB_OUTPUT: files.output,
        GITHUB_EVENT_PATH: files.event,
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_SHA: 'abc123',
        RUNNER_TEMP: dir,
        RSPEC_TITLE: '# :cold_sweat: RSpec failure',
        RSPEC_HIDE_FOOTER_LINK: 'false',
        RSPEC_PROFILE_TITLE: '# Slowest examples',
        ...env
      }
    })
    const outputs = {}
    for (const m of fs
      .readFileSync(files.output, 'utf-8')
      .matchAll(/^([\w-]+)<<(\S+)\n([\s\S]*?)\n\2\n/gm)) {
      outputs[m[1]] = m[3]
    }
    return { proc, outputs, summary: fs.readFileSync(files.summary, 'utf-8') }
  }

  test('writes the job summary, comment bodies and outputs on failure', () => {
    const { proc, outputs, summary } = runScript({
      RSPEC_JSON_PATH: '.dummy_results-*.json'
    })
    assert.equal(proc.status, 0)
    assert.equal(proc.stdout, '12 examples, 3 failures, 1 pending\n')
    assert.ok(
      summary.startsWith(
        `<h1>RSpec Result</h1>${os.EOL}:cold_sweat: 12 examples, 3 failures, 1 pending\n\n`
      )
    )
    assert.ok(
      summary.endsWith(
        '\nReported by [rspec-report-action](https://github.com/SonicGarden/rspec-report-action)'
      )
    )
    assert.equal(outputs.success, 'false')
    assert.equal(outputs['pr-number'], '42')
    const failure = fs.readFileSync(outputs['failure-comment-path'], 'utf-8')
    assert.ok(
      failure.startsWith(
        '# :cold_sweat: RSpec failure\n\n12 examples, 3 failures, 1 pending\n\n```\n'
      )
    )
    const profile = fs.readFileSync(outputs['profile-comment-path'], 'utf-8')
    assert.ok(
      profile.startsWith(
        '# Slowest examples\n<details>\n<summary>Top 10 slowest examples (0.68 seconds, 96.86% of total time)</summary>\n\n| Example'
      )
    )
  })

  test('skips the summary and failure comment on success', () => {
    const { proc, outputs, summary } = runScript({
      RSPEC_JSON_PATH: 'nope-*.json'
    })
    assert.equal(proc.status, 0)
    assert.equal(summary, '')
    assert.equal(outputs.success, 'true')
    assert.equal(outputs['failure-comment-path'], '')
    assert.ok(fs.existsSync(outputs['profile-comment-path']))
  })

  test('fails when json-path is missing', () => {
    const { proc } = runScript({ RSPEC_JSON_PATH: '' })
    assert.equal(proc.status, 1)
    assert.equal(
      proc.stdout,
      '::error::Input required and not supplied: json-path\n'
    )
  })
})
