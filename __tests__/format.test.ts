import { expect, jest, test, describe } from '@jest/globals'

jest.unstable_mockModule('@actions/github', () => ({
  context: {
    serverUrl: 'https://github.com',
    sha: 'abc123',
    repo: { owner: 'owner', repo: 'repo' }
  }
}))

const { buildBaseUrl, formatFailureList } = await import('../src/format.js')

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

describe('formatFailureList', () => {
  test('keeps the message unprocessed (trimmed, newlines intact, no &nbsp;)', () => {
    const result = formatFailureList(
      [
        example({
          message: '\nexpected: true\n     got: false\n\n(compared using ==)'
        })
      ],
      baseUrl
    )
    expect(result).toContain(
      'expected: true\n     got: false\n\n(compared using ==)'
    )
    expect(result).not.toContain('&nbsp;')
  })

  test('renders a plain list line and a single details with linked heading and merged message/backtrace', () => {
    const result = formatFailureList([example()], baseUrl)
    // 初期表示はリンクなしのプレーン行（path:line description）
    expect(result).toContain(
      'spec/models/foo_spec.rb:18 Foo is expected to be valid'
    )
    // details はちょうど 1 個
    expect(result.match(/<details>/g)?.length).toBe(1)
    expect(result).toContain('<details><summary>Details</summary>')
    // 見出しはリンク + description
    expect(result).toContain(
      `### [spec/models/foo_spec.rb:18](${baseUrl}/spec/models/foo_spec.rb#L18) Foo is expected to be valid`
    )
    // message と backtrace は同一コードブロック内に空行区切りで連結
    expect(result).toContain(
      "expected true\n     got: false\n\n./spec/models/foo_spec.rb:18:in 'block (4 levels) in <main>'"
    )
  })

  test('keeps message and backtrace in a single code block (no extra block when backtrace empty)', () => {
    const withBacktrace = formatFailureList([example()], baseUrl)
    const withoutBacktrace = formatFailureList(
      [example({ backtrace: [] })],
      baseUrl
    )
    expect(withoutBacktrace).toContain('expected true\n     got: false')
    // backtrace の有無に関わらずブロック数は同じ（リスト用1 + details用1 = ``` が計4個）
    expect(withBacktrace.match(/```/g)?.length).toBe(4)
    expect(withoutBacktrace.match(/```/g)?.length).toBe(4)
  })

  test('caps the list at the limit and reports the remaining count', () => {
    const examples = Array.from({ length: 23 }, (_, i) =>
      example({ lineNumber: i + 1 })
    )
    const result = formatFailureList(examples, baseUrl, 20)
    expect(result).toContain('... and 3 more failures')
    // details はまとめて 1 個
    expect(result.match(/<details>/g)?.length).toBe(1)
    // details 内のリンク付き見出しは 20 個
    expect(result.match(/### \[/g)?.length).toBe(20)
  })

  test('does not add the more-failures line within the limit', () => {
    const examples = [example(), example({ lineNumber: 19 })]
    const result = formatFailureList(examples, baseUrl, 20)
    expect(result).not.toContain('more failures')
  })
})
