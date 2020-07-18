import markdownTable from 'markdown-table'
import type {FailureResult} from './parse'

export function example2Table(examples: FailureResult['examples']): string {
  return markdownTable([
    ['Example', 'Description', 'Message'],
    ...examples.map(({example, description, message}) => [
      example,
      description,
      message.replace(/\n+/g, ' ')
    ])
  ])
}
