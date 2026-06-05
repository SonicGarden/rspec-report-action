import * as github from '@actions/github'
import type { RspecResult } from './parse.js'

// Maximum number of failures to list. Anything beyond is summarized as "... and N more failures".
const MAX_LIST_ITEMS = 20

type FailureExample = RspecResult['examples'][number]

// Build the base URL used for linking to the failing source.
// e.g. https://github.com/owner/repo/blob/<sha>
export const buildBaseUrl = (): string => {
  const { serverUrl, sha } = github.context
  const { owner, repo } = github.context.repo
  return `${serverUrl}/${owner}/${repo}/blob/${sha}`
}

const codeBlock = (content: string): string => `\`\`\`\n${content}\n\`\`\``

// Label for a failure (path:line). Used both in list rows and details headings.
const exampleLabel = ({ filePath, lineNumber }: FailureExample): string =>
  `${filePath}:${lineNumber}`

// Link URL to the failing source. Used in details headings.
const exampleLink = (example: FailureExample, baseUrl: string): string =>
  `${baseUrl}/${example.filePath}#L${example.lineNumber}`

// A single line in the initial code block. Plain text with path:line and description, no link.
// Being inside a code block, it carries no link and stays easy to copy & paste.
// e.g. spec/models/foo_spec.rb:18 Foo is expected to be valid
const formatListLine = (example: FailureExample): string =>
  `${exampleLabel(example)} ${example.description}`

// Build the section for a single failure shown inside the details block.
// It consists of a heading (source link + description) plus a single code block joining message and backtrace.
// The message is emitted verbatim, only trimmed of surrounding whitespace (the old truncate / newline-to-space / &nbsp; replacement is dropped).
// The backtrace follows below the message, separated by a blank line, only when project lines exist.
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

// Build the full Markdown for the failure list.
// (A) A single code block listing failures and descriptions (no links, easy to copy).
// (B) A single <details> block gathering all failure details (linked headings + message & backtrace).
// The limit applies equally to both the list and the details; overflow is shown as a count only.
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
