import { expect, jest, test, describe } from '@jest/globals'

jest.unstable_mockModule('@actions/github', () => ({
  context: {
    serverUrl: 'https://github.com',
    sha: 'abc123',
    repo: { owner: 'owner', repo: 'repo' }
  }
}))

const { buildBaseUrl, formatFailureItem, formatFailureList } =
  await import('../src/format.js')

const baseUrl = 'https://github.com/owner/repo/blob/abc123'

const example = (overrides = {}) => ({
  filePath: 'spec/models/foo_spec.rb',
  lineNumber: 18,
  description: 'Foo is expected to be valid',
  message: 'expected true\n     got: false',
  backtrace: ["./spec/models/foo_spec.rb:18:in 'block (4 levels) in <main>'"],
  ...overrides
})

describe('buildBaseUrl', () => {
  test('builds blob base url from github context', () => {
    expect(buildBaseUrl()).toBe(baseUrl)
  })
})

describe('formatFailureItem', () => {
  test('keeps the message unprocessed (trimmed, newlines intact, no &nbsp;)', () => {
    const result = formatFailureItem(
      example({
        message: '\nexpected: true\n     got: false\n\n(compared using ==)'
      }),
      baseUrl
    )
    expect(result).toContain(
      'expected: true\n     got: false\n\n(compared using ==)'
    )
    expect(result).not.toContain('&nbsp;')
  })

  test('renders a linked list line with details containing message and backtrace', () => {
    const result = formatFailureItem(example(), baseUrl)
    expect(result).toContain(
      `- [spec/models/foo_spec.rb:18](${baseUrl}/spec/models/foo_spec.rb#L18) Foo is expected to be valid`
    )
    expect(result).toContain('<details><summary>Details</summary>')
    expect(result).toContain('expected true\n     got: false')
    expect(result).toContain(
      "./spec/models/foo_spec.rb:18:in 'block (4 levels) in <main>'"
    )
  })

  test('omits the backtrace block when backtrace is empty', () => {
    const result = formatFailureItem(example({ backtrace: [] }), baseUrl)
    expect(result).toContain('expected true\n     got: false')
    // message のコードブロックは1つだけ（backtrace ブロックなし）
    expect(result.match(/```/g)?.length).toBe(2)
  })
})

describe('formatFailureList', () => {
  test('caps the list at the limit and reports the remaining count', () => {
    const examples = Array.from({ length: 23 }, (_, i) =>
      example({ lineNumber: i + 1 })
    )
    const result = formatFailureList(examples, baseUrl, 20)
    expect(result).toContain('- ... and 3 more failures')
    expect(result.match(/<details>/g)?.length).toBe(20)
  })

  test('does not add the more-failures line within the limit', () => {
    const examples = [example(), example({ lineNumber: 19 })]
    const result = formatFailureList(examples, baseUrl, 20)
    expect(result).not.toContain('more failures')
  })
})
