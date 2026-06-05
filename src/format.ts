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

// 失敗 1 件分の Markdown（リンク付きリスト行 + details）を生成する。
// details には message を常に、backtrace はプロジェクト行がある場合のみコードブロックで格納する。
// message は前後の空白を除くだけで無加工のまま出す（旧実装の truncate / 改行→空白 / &nbsp; 置換は撤廃）。
export const formatFailureItem = (
  { filePath, lineNumber, description, message, backtrace }: FailureExample,
  baseUrl: string
): string => {
  const link = `${baseUrl}/${filePath}#L${lineNumber}`
  const detailBlocks = [codeBlock(message.trim())]
  if (backtrace.length > 0) {
    detailBlocks.push(codeBlock(backtrace.join('\n')))
  }

  return `- [${filePath}:${lineNumber}](${link}) ${description}
  <details><summary>Details</summary>

${detailBlocks.join('\n\n')}

  </details>`
}

// 失敗一覧全体の Markdown を生成する。先頭 limit 件のみ詳細を出し、超過分は件数のみ示す。
export const formatFailureList = (
  examples: FailureExample[],
  baseUrl: string,
  limit: number = MAX_LIST_ITEMS
): string => {
  const items = examples
    .slice(0, limit)
    .map((example) => formatFailureItem(example, baseUrl))

  const remaining = examples.length - limit
  if (remaining > 0) {
    items.push(`- ... and ${remaining} more failures`)
  }

  return items.join('\n')
}
