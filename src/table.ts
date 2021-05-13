import {markdownTable} from 'markdown-table'
import type {RspecResult} from './parse'

export function example2Table(examples: RspecResult['examples']): string {
  return markdownTable([
    ['Example', 'Description', 'Message'],
    ...examples.map(({example, description, message}) => [
      example,
      description,
      message.replace(/\n+/g, ' ')
    ])
  ])
}
