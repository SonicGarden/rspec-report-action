import path from 'path'

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

export function parse(resultPath: string): RspecResult {
  // eslint-disable-next-line import/no-dynamic-require,@typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
  const json = require(
    path.resolve(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      process.env.GITHUB_WORKSPACE!,
      resultPath
    )
  ) as JsonResult

  const examples: FailureExample[] = json.examples
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

  return {
    examples,
    summary: json.summary_line,
    success: examples.length === 0
  }
}
