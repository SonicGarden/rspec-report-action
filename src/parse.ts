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
  example: string
  description: string
  message: string
}

export type FailureResult = {
  examples: FailureExample[]
  summary: string
}

export function parse(resultPath: string): FailureResult {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const json = require(path.resolve(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.GITHUB_WORKSPACE!,
    resultPath
  )) as JsonResult

  const examples: FailureExample[] = json.examples
    .filter(({status}) => status === 'failed')
    .map(({file_path, line_number, full_description, exception}) => {
      return {
        description: full_description,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        message: exception!.message,
        example: [file_path, line_number].join(':')
      }
    })

  return {
    examples,
    summary: json.summary_line
  }
}
