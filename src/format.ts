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

// 失敗 1 件分のリンク付きリスト行を生成する。
// 例: - [spec/models/foo_spec.rb:18](link) Foo is expected to be valid
const formatListLine = (example: FailureExample, baseUrl: string): string => {
  const { filePath, lineNumber, description } = example
  const link = `${baseUrl}/${filePath}#L${lineNumber}`
  return `- [${exampleLabel(example)}](${link}) ${description}`
}

// details 内に出す失敗 1 件分のセクションを生成する。
// 見出し + message（常時）+ backtrace（プロジェクト行がある場合のみ）をコードブロックで並べる。
// message は前後の空白を除くだけで無加工のまま出す（旧実装の truncate / 改行→空白 / &nbsp; 置換は撤廃）。
// description はリストに既出のため見出しには含めない。
const formatDetailSection = (example: FailureExample): string => {
  const { message, backtrace } = example
  const blocks = [`### ${exampleLabel(example)}`, codeBlock(message.trim())]
  if (backtrace.length > 0) {
    blocks.push(codeBlock(backtrace.join('\n')))
  }
  return blocks.join('\n\n')
}

// 失敗一覧全体の Markdown を生成する。
// (A) トップレベルのリンクリスト（プレーンに並びコピーしやすい）
// (B) 全失敗の詳細をまとめた単一の <details>
// 上限 limit はリスト・details の双方に同じく適用し、超過分は件数のみ示す。
export const formatFailureList = (
  examples: FailureExample[],
  baseUrl: string,
  limit: number = MAX_LIST_ITEMS
): string => {
  const shown = examples.slice(0, limit)
  const remaining = examples.length - shown.length

  const listLines = shown.map((example) => formatListLine(example, baseUrl))
  if (remaining > 0) {
    listLines.push(`- ... and ${remaining} more failures`)
  }
  const list = listLines.join('\n')

  const details = `<details><summary>Details</summary>\n\n${shown
    .map(formatDetailSection)
    .join('\n\n')}\n\n</details>`

  return `${list}\n\n${details}`
}
