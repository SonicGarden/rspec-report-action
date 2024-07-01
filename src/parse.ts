import path from 'path'
import {readFile} from 'fs/promises'

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
}

export type RspecResult = {
  examples: FailureExample[]
  summary: string
  success: boolean
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
  const promises = resultPaths.map(async resultPath => {
    return JSON.parse(
      await readFile(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
    .filter(({status}) => status === 'failed')
    .map(({file_path, line_number, full_description, exception}) => {
      return {
        description: full_description,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        message: exception!.message,
        filePath: file_path.replace(/^\.\//, ''),
        lineNumber: line_number
      }
    })
  const totalExamples = allExamples.length
  const failedExamples = examples.length
  const pendingExamples = allExamples.filter(
    example => example.pending_message !== null
  ).length

  return {
    examples,
    summary: generateSummary(totalExamples, failedExamples, pendingExamples),
    success: examples.length === 0
  }
}
