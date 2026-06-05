import path from 'node:path'
import { readFile } from 'node:fs/promises'

interface Exception {
  class: string
  message: string
  backtrace: string[]
}

interface Example {
  id: string
  description: string
  full_description: string
  status: 'passed' | 'failed'
  file_path: string
  line_number: number
  run_time: number
  pending_message: string | null
  exception?: Exception
}

interface JsonResult {
  examples: Example[]
  summary_line: string
}

type FailureExample = {
  filePath: string
  lineNumber: number
  description: string
  message: string
  backtrace: string[]
}

type SlowExample = {
  filePath: string
  lineNumber: number
  description: string
  runTime: number
}

export type RspecResult = {
  examples: FailureExample[]
  slowExamples: SlowExample[]
  summary: string
  success: boolean
  totalTime: number
}

const MAX_BACKTRACE_LINES = 10

// Regex to exclude gem / ruby core paths (fallback for absolute-path backtraces).
const NON_PROJECT_BACKTRACE =
  /[/\\](gems|ruby|\.rbenv|\.rvm|\.bundle|vendor[/\\]bundle)[/\\]/

// Extract only the project-local lines from a backtrace.
// 1. Prefer project-root-relative paths (the CI default, starting with `./`).
// 2. Otherwise, keep lines that are not gem / ruby core (fallback for absolute-path output).
// 3. If still empty, return an empty array and the caller omits the backtrace section.
function extractProjectBacktrace(backtrace: string[]): string[] {
  const relative = backtrace.filter((line) => line.startsWith('./'))
  const lines =
    relative.length > 0
      ? relative
      : backtrace.filter((line) => !NON_PROJECT_BACKTRACE.test(line))
  return lines.slice(0, MAX_BACKTRACE_LINES)
}

function pluralize(noun: string, count: number): string {
  if (count === 1) return noun
  return `${noun}s`
}

function generateSummary(
  total: number,
  failed: number,
  pending: number
): string {
  let summary = `${total} ${pluralize('example', total)}`
  summary += `, ${failed} ${pluralize('failure', failed)}`
  if (pending > 0) {
    summary += `, ${pending} pending`
  }
  return summary
}

export async function parse(resultPaths: string[]): Promise<RspecResult> {
  const promises = resultPaths.map(async (resultPath) => {
    return JSON.parse(
      await readFile(
        path.resolve(process.env.GITHUB_WORKSPACE!, resultPath),
        'utf-8'
      )
    ) as JsonResult
  })
  const results = await Promise.all(promises)

  const allExamples = results.reduce(
    (acc, jsonResult) => acc.concat(jsonResult.examples),
    [] as Example[]
  )
  const examples: FailureExample[] = allExamples
    .filter(({ status }) => status === 'failed')
    .map(({ file_path, line_number, full_description, exception }) => {
      return {
        description: full_description,
        message: exception!.message,
        backtrace: extractProjectBacktrace(exception!.backtrace ?? []),
        filePath: file_path.replace(/^\.\//, ''),
        lineNumber: line_number
      }
    })
  const slowExamples: SlowExample[] = [...allExamples]
    .sort((a, b) => b.run_time - a.run_time)
    .slice(0, 10)
    .map(({ file_path, line_number, full_description, run_time }) => {
      return {
        description: full_description,
        filePath: file_path.replace(/^\.\//, ''),
        lineNumber: line_number,
        runTime: run_time
      }
    })
  const totalExamples = allExamples.length
  const failedExamples = examples.length
  const pendingExamples = allExamples.filter(
    (example) => example.pending_message !== null
  ).length
  const totalTime = allExamples.reduce(
    (total, { run_time }) => total + run_time,
    0
  )

  return {
    examples,
    slowExamples,
    summary: generateSummary(totalExamples, failedExamples, pendingExamples),
    success: examples.length === 0,
    totalTime
  }
}
