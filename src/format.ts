import * as github from '@actions/github'
import type { RspecResult } from './parse.js'

// 失敗一覧に表示する最大件数。超過分は "... and N more failures" にまとめる。
const MAX_LIST_ITEMS = 20

type FailureExample = RspecResult['examples'][number]

// 失敗箇所のソースへのリンクに使うベース URL を組み立てる。
// 例: https://github.com/owner/repo/blob/<sha>
export const buildBaseUrl = (): string => {
  const { serverUrl, sha } = github.context
  const { owner, repo } = github.context.repo
  return `${serverUrl}/${owner}/${repo}/blob/${sha}`
}

const codeBlock = (content: string): string => `\`\`\`\n${content}\n\`\`\``

// 失敗箇所のラベル（path:line）。リスト行・details 見出しの双方で使う。
const exampleLabel = ({ filePath, lineNumber }: FailureExample): string =>
  `${filePath}:${lineNumber}`

// 失敗箇所のソースへのリンク URL。details 見出しで使う。
const exampleLink = (example: FailureExample, baseUrl: string): string =>
  `${baseUrl}/${example.filePath}#L${example.lineNumber}`

// 初期表示コードブロックの 1 行。リンクなしのプレーンテキストで path:line と description を並べる。
// コードブロック内なのでリンクは付かず、そのままコピー・貼り付けしやすい。
// 例: spec/models/foo_spec.rb:18 Foo is expected to be valid
const formatListLine = (example: FailureExample): string =>
  `${exampleLabel(example)} ${example.description}`

// details 内に出す失敗 1 件分のセクションを生成する。
// 見出し（ソースへのリンク + description）+ message と backtrace を結合した単一コードブロックで構成する。
// message は前後の空白を除くだけで無加工のまま出す（旧実装の truncate / 改行→空白 / &nbsp; 置換は撤廃）。
// backtrace はプロジェクト行がある場合のみ message の下に空行区切りで続ける。
const formatDetailSection = (
  example: FailureExample,
  baseUrl: string
): string => {
  const { message, backtrace, description } = example
  const link = exampleLink(example, baseUrl)
  const heading = `### [${exampleLabel(example)}](${link}) ${description}`
  const trimmedMessage = message.trim()
  const body =
    backtrace.length > 0
      ? `${trimmedMessage}\n\n${backtrace.join('\n')}`
      : trimmedMessage
  return `${heading}\n\n${codeBlock(body)}`
}

// 失敗一覧全体の Markdown を生成する。
// (A) 失敗箇所と description を並べた単一コードブロック（リンクなしでコピーしやすい）
// (B) 全失敗の詳細（リンク付き見出し + message&backtrace）をまとめた単一の <details>
// 上限 limit はリスト・details の双方に同じく適用し、超過分は件数のみ示す。
export const formatFailureList = (
  examples: FailureExample[],
  baseUrl: string,
  limit: number = MAX_LIST_ITEMS
): string => {
  const shown = examples.slice(0, limit)
  const remaining = examples.length - shown.length

  const listLines = shown.map(formatListLine)
  if (remaining > 0) {
    listLines.push(`... and ${remaining} more failures`)
  }
  const list = codeBlock(listLines.join('\n'))

  const details = `<details><summary>Details</summary>\n\n${shown
    .map((example) => formatDetailSection(example, baseUrl))
    .join('\n\n')}\n\n</details>`

  return `${list}\n\n${details}`
}
