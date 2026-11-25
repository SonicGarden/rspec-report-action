#!/usr/bin/env node
// Reports RSpec failures as a Job Summary and prepares PR comment bodies.
// Zero-dependency port of the former TypeScript action. Requires Node >= 22.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

// Maximum number of failures to list. Anything beyond is summarized as "... and N more failures".
export const MAX_LIST_ITEMS = 20
const MAX_BACKTRACE_LINES = 10
const MAX_SLOW_EXAMPLES = 10

const FOOTER_LINK =
  'Reported by [rspec-report-action](https://github.com/SonicGarden/rspec-report-action)'

// ---------------------------------------------------------------------------
// Workflow command helpers (equivalents of @actions/core)
// ---------------------------------------------------------------------------

// Escape characters that cannot appear in workflow command data.
function escapeData(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
}

function warning(message) {
  process.stdout.write(`::warning::${escapeData(message)}\n`)
}

function setFailed(message) {
  process.stdout.write(`::error::${escapeData(message)}\n`)
  process.exitCode = 1
}

// Read an input passed through the composite action's env.
function getInput(envName, { required = false, label = envName } = {}) {
  const value = (process.env[envName] ?? '').trim()
  if (required && !value) {
    throw new Error(`Input required and not supplied: ${label}`)
  }
  return value
}

// Write a step output using the multi-line safe heredoc format.
function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT
  if (!file) return
  const delimiter = `ghadelimiter_${randomUUID()}`
  fs.appendFileSync(
    file,
    `${name}<<${delimiter}${os.EOL}${value}${os.EOL}${delimiter}${os.EOL}`
  )
}

// ---------------------------------------------------------------------------
// Glob (subset of fast-glob with `dot: true`)
// Supports `*`, `?`, `[...]`, `{a,b}` and `**`. Dotfiles and dot directories match.
// ---------------------------------------------------------------------------

// Expand the first top-level `{a,b}` group recursively.
export function expandBraces(pattern) {
  let depth = 0
  let start = -1
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    if (c === '\\') {
      i++
    } else if (c === '{') {
      if (depth++ === 0) start = i
    } else if (c === '}' && depth > 0) {
      if (--depth === 0) {
        const body = pattern.slice(start + 1, i)
        const alternatives = splitTopLevel(body)
        if (alternatives.length < 2) continue
        const prefix = pattern.slice(0, start)
        const suffix = pattern.slice(i + 1)
        return alternatives.flatMap((alt) =>
          expandBraces(`${prefix}${alt}${suffix}`)
        )
      }
    }
  }
  return [pattern]
}

function splitTopLevel(body) {
  const parts = []
  let depth = 0
  let current = ''
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (c === '\\') {
      current += c + (body[i + 1] ?? '')
      i++
      continue
    }
    if (c === '{') depth++
    if (c === '}') depth--
    if (c === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += c
    }
  }
  parts.push(current)
  return parts
}

const hasMagic = (segment) => /[*?[\\]/.test(segment)

// Convert a single path segment glob into an anchored RegExp.
function segmentToRegExp(segment) {
  let re = ''
  for (let i = 0; i < segment.length; i++) {
    const c = segment[i]
    if (c === '\\') {
      re += escapeRegExp(segment[++i] ?? '')
    } else if (c === '*') {
      re += '[^/]*'
    } else if (c === '?') {
      re += '[^/]'
    } else if (c === '[') {
      const end = segment.indexOf(']', i + 2)
      if (end === -1) {
        re += '\\['
        continue
      }
      let cls = segment.slice(i + 1, end)
      if (cls[0] === '!' || cls[0] === '^') cls = `^${cls.slice(1)}`
      re += `[${cls.replace(/\\/g, '\\\\')}]`
      i = end
    } else {
      re += escapeRegExp(c)
    }
  }
  return new RegExp(`^${re}$`)
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

function readDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

function isDirectory(dir, entry) {
  if (entry.isDirectory()) return true
  if (!entry.isSymbolicLink()) return false
  try {
    return fs.statSync(path.join(dir, entry.name)).isDirectory()
  } catch {
    return false
  }
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile()
  } catch {
    return false
  }
}

// Order like fast-glob's breadth-first walk: shallower paths first, then by path segments.
function compareGlobResults(a, b) {
  const as = a.split('/')
  const bs = b.split('/')
  if (as.length !== bs.length) return as.length - bs.length
  for (let i = 0; i < as.length; i++) {
    if (as[i] !== bs[i]) return as[i] < bs[i] ? -1 : 1
  }
  return 0
}

// Return files matching `pattern`. Relative patterns are resolved against `cwd` and
// returned relative to it; absolute patterns return absolute paths.
export function globFiles(pattern, cwd) {
  const results = new Set()
  for (const expanded of expandBraces(pattern)) {
    const absolute = path.isAbsolute(expanded)
    const root = absolute ? path.parse(expanded).root : cwd
    const segments = (absolute ? expanded.slice(root.length) : expanded)
      .split('/')
      .filter((s) => s !== '')

    const walk = (dir, rel, index, visited) => {
      if (index === segments.length) {
        if (rel.length > 0 && isFile(dir)) {
          results.add(absolute ? dir : rel.join('/'))
        }
        return
      }
      const segment = segments[index]
      if (segment === '**') {
        const last = index === segments.length - 1
        // A trailing `**` matches files beneath it, not the directory itself.
        if (!last) walk(dir, rel, index + 1, visited)
        for (const entry of readDir(dir)) {
          if (!isDirectory(dir, entry)) {
            if (last)
              walk(
                path.join(dir, entry.name),
                [...rel, entry.name],
                index + 1,
                visited
              )
            continue
          }
          const child = path.join(dir, entry.name)
          // Guard against symlink loops.
          let real
          try {
            real = fs.realpathSync(child)
          } catch {
            continue
          }
          if (visited.has(real)) continue
          visited.add(real)
          walk(child, [...rel, entry.name], index, visited)
          visited.delete(real)
        }
      } else if (!hasMagic(segment)) {
        walk(path.join(dir, segment), [...rel, segment], index + 1, visited)
      } else {
        const re = segmentToRegExp(segment)
        for (const entry of readDir(dir)) {
          if (re.test(entry.name)) {
            walk(
              path.join(dir, entry.name),
              [...rel, entry.name],
              index + 1,
              visited
            )
          }
        }
      }
    }

    walk(root, [], 0, new Set())
  }
  return [...results].sort(compareGlobResults)
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

// Regex to exclude gem / ruby core paths (fallback for absolute-path backtraces).
const NON_PROJECT_BACKTRACE =
  /[/\\](gems|ruby|\.rbenv|\.rvm|\.bundle|vendor[/\\]bundle)[/\\]/

// Extract only the project-local lines from a backtrace.
// 1. Prefer project-root-relative paths (the CI default, starting with `./`).
// 2. Otherwise, keep lines that are not gem / ruby core (fallback for absolute-path output).
// 3. If still empty, return an empty array and the caller omits the backtrace section.
export function extractProjectBacktrace(backtrace) {
  const relative = backtrace.filter((line) => line.startsWith('./'))
  const lines =
    relative.length > 0
      ? relative
      : backtrace.filter((line) => !NON_PROJECT_BACKTRACE.test(line))
  return lines.slice(0, MAX_BACKTRACE_LINES)
}

const pluralize = (noun, count) => (count === 1 ? noun : `${noun}s`)

function generateSummary(total, failed, pending) {
  let summary = `${total} ${pluralize('example', total)}`
  summary += `, ${failed} ${pluralize('failure', failed)}`
  if (pending > 0) {
    summary += `, ${pending} pending`
  }
  return summary
}

const stripDotSlash = (filePath) => filePath.replace(/^\.\//, '')

// Parse and merge RSpec JSON results. Paths are resolved against `workspace`.
export function parse(
  resultPaths,
  workspace = process.env.GITHUB_WORKSPACE ?? ''
) {
  const allExamples = resultPaths.flatMap(
    (resultPath) =>
      JSON.parse(fs.readFileSync(path.resolve(workspace, resultPath), 'utf-8'))
        .examples
  )

  const examples = allExamples
    .filter(({ status }) => status === 'failed')
    .map(({ file_path, line_number, full_description, exception }) => ({
      description: full_description,
      message: exception.message,
      backtrace: extractProjectBacktrace(exception.backtrace ?? []),
      filePath: stripDotSlash(file_path),
      lineNumber: line_number
    }))
  const slowExamples = [...allExamples]
    .sort((a, b) => b.run_time - a.run_time)
    .slice(0, MAX_SLOW_EXAMPLES)
    .map(({ file_path, line_number, full_description, run_time }) => ({
      description: full_description,
      filePath: stripDotSlash(file_path),
      lineNumber: line_number,
      runTime: run_time
    }))
  const pending = allExamples.filter(
    (example) => example.pending_message !== null
  ).length
  const totalTime = sumRunTime(allExamples.map(({ run_time }) => run_time))

  return {
    examples,
    slowExamples,
    summary: generateSummary(allExamples.length, examples.length, pending),
    success: examples.length === 0,
    totalTime
  }
}

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

// Build the base URL used for linking to the failing source.
// e.g. https://github.com/owner/repo/blob/<sha>
export function buildBaseUrl(env = process.env) {
  const serverUrl = env.GITHUB_SERVER_URL || 'https://github.com'
  return `${serverUrl}/${env.GITHUB_REPOSITORY ?? ''}/blob/${env.GITHUB_SHA ?? ''}`
}

const codeBlock = (content) => `\`\`\`\n${content}\n\`\`\``

const exampleLabel = ({ filePath, lineNumber }) => `${filePath}:${lineNumber}`

// Section for a single failure inside the details block: a linked heading plus
// one code block holding the trimmed message and, when present, the backtrace.
function formatDetailSection(example, baseUrl) {
  const { message, backtrace, description } = example
  const link = `${baseUrl}/${example.filePath}#L${example.lineNumber}`
  const heading = `### [${exampleLabel(example)}](${link}) ${description}`
  const trimmedMessage = message.trim()
  const body =
    backtrace.length > 0
      ? `${trimmedMessage}\n\n${backtrace.join('\n')}`
      : trimmedMessage
  return `${heading}\n\n${codeBlock(body)}`
}

// Build the full Markdown for the failure list.
// (A) A single code block listing `path:line description` (no links, easy to copy).
// (B) A single <details> block gathering all failure details.
// The limit applies equally to both; overflow is shown as a count only.
export function formatFailureList(examples, baseUrl, limit = MAX_LIST_ITEMS) {
  const shown = examples.slice(0, limit)
  const remaining = examples.length - shown.length

  const listLines = shown.map(
    (example) => `${exampleLabel(example)} ${example.description}`
  )
  if (remaining > 0) {
    listLines.push(`... and ${remaining} more failures`)
  }
  const list = codeBlock(listLines.join('\n'))

  const details = `<details><summary>Details</summary>\n\n${shown
    .map((example) => formatDetailSection(example, baseUrl))
    .join('\n\n')}\n\n</details>`

  return `${list}\n\n${details}`
}

export const floor = (n, ndigits) => {
  const shift = Math.pow(10, ndigits)
  return Math.floor(n * shift) / shift
}

// Render rows as a Markdown table, matching markdown-table v3 default output
// (cells padded to the column width, no escaping).
export function markdownTable(rows) {
  const columns = Math.max(...rows.map((row) => row.length))
  const widths = Array.from({ length: columns }, (_, i) =>
    Math.max(1, ...rows.map((row) => String(row[i] ?? '').length))
  )
  const line = (cells) =>
    `| ${widths.map((w, i) => String(cells[i] ?? '').padEnd(w)).join(' | ')} |`
  return [
    line(rows[0]),
    line(widths.map((w) => '-'.repeat(w))),
    ...rows.slice(1).map(line)
  ].join('\n')
}

export function examplesTable(slowExamples) {
  return markdownTable([
    ['Example', 'Description', 'Time in seconds'],
    ...slowExamples.map(({ filePath, lineNumber, description, runTime }) => [
      `${filePath}:${lineNumber}`,
      description,
      String(floor(runTime, 5))
    ])
  ])
}

// ---------------------------------------------------------------------------
// Report bodies
// ---------------------------------------------------------------------------

export function buildSummary(result, { baseUrl, hideFooterLink = false }) {
  const icon = result.success ? ':tada:' : ':cold_sweat:'
  return (
    `<h1>RSpec Result</h1>${os.EOL}` +
    `${icon} ${result.summary}` +
    `\n\n${formatFailureList(result.examples, baseUrl)}\n` +
    (hideFooterLink ? '' : `\n${FOOTER_LINK}`)
  )
}

export function buildFailureComment(result, { title, baseUrl }) {
  return `${title}

${result.summary}

${formatFailureList(result.examples, baseUrl)}
`
}

function sumRunTime(times) {
  return times.reduce((total, time) => total + time, 0)
}

function slowestExamplesSummary(result) {
  const slowTotalTime = sumRunTime(
    result.slowExamples.map(({ runTime }) => runTime)
  )
  const percentage = (slowTotalTime / result.totalTime) * 100
  return `Top ${result.slowExamples.length} slowest examples (${floor(slowTotalTime, 2)} seconds, ${floor(percentage, 2)}% of total time)`
}

export function buildProfileComment(result, { title }) {
  return `${title}
<details>
<summary>${slowestExamplesSummary(result)}</summary>

${examplesTable(result.slowExamples)}

</details>
`
}

// Resolve the issue / PR number like @actions/github's `context.issue.number`.
export function resolvePrNumber(eventPath = process.env.GITHUB_EVENT_PATH) {
  if (!eventPath || !fs.existsSync(eventPath)) return ''
  const payload = JSON.parse(fs.readFileSync(eventPath, 'utf-8'))
  const number = (payload.issue || payload.pull_request || payload).number
  return number ? String(number) : ''
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function run() {
  try {
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd()
    const pattern = getInput('RSPEC_JSON_PATH', {
      required: true,
      label: 'json-path'
    })

    const jsonPaths = globFiles(pattern, workspace).filter((jsonPath) => {
      try {
        fs.accessSync(path.resolve(workspace, jsonPath), fs.constants.R_OK)
        return true
      } catch {
        warning(`${jsonPath}: access error!`)
        return false
      }
    })

    const result = parse(jsonPaths, workspace)
    process.stdout.write(`${result.summary}\n`)

    const baseUrl = buildBaseUrl()
    if (!result.success && process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        buildSummary(result, {
          baseUrl,
          hideFooterLink: getInput('RSPEC_HIDE_FOOTER_LINK') === 'true'
        })
      )
    }

    const tempDir = process.env.RUNNER_TEMP || os.tmpdir()
    const outDir = fs.mkdtempSync(path.join(tempDir, 'rspec-report-'))

    let failureCommentPath = ''
    if (!result.success) {
      failureCommentPath = path.join(outDir, 'failure-comment.md')
      const title = getInput('RSPEC_TITLE')
      fs.writeFileSync(
        failureCommentPath,
        buildFailureComment(result, { title, baseUrl })
      )
    }

    const profileCommentPath = path.join(outDir, 'profile-comment.md')
    const profileTitle = getInput('RSPEC_PROFILE_TITLE')
    fs.writeFileSync(
      profileCommentPath,
      buildProfileComment(result, { title: profileTitle })
    )

    setOutput('success', String(result.success))
    setOutput('pr-number', resolvePrNumber())
    setOutput('failure-comment-path', failureCommentPath)
    setOutput('profile-comment-path', profileCommentPath)
  } catch (error) {
    setFailed(error instanceof Error ? error.message : String(error))
  }
}

const MIN_NODE_MAJOR = 22

if (
  process.argv[1] !== undefined &&
  import.meta.filename === fs.realpathSync(process.argv[1])
) {
  const major = Number(process.versions.node.split('.')[0])
  if (major < MIN_NODE_MAJOR) {
    setFailed(
      `rspec-report-action requires Node.js >= ${MIN_NODE_MAJOR} on the runner (found ${process.version}).`
    )
  } else {
    run()
  }
}
