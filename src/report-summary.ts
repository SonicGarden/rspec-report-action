import * as core from '@actions/core'
import type {RspecResult} from './parse'

export const reportSummary = async (result: RspecResult): Promise<void> => {
  const icon = result.success ? ':tada:' : ':cold_sweat:'
  const summary = `${icon} ${result.summary}`
  const rows = result.examples.map(({example, description, message}) => [
    example,
    description,
    message.replace(/\n+/g, ' ')
  ])

  await core.summary
    .addHeading('RSpec Result')
    .addRaw(summary)
    .addTable([
      [
        {data: 'Example', header: true},
        {data: 'Description', header: true},
        {data: 'Message', header: true}
      ],
      ...rows
    ])
    .write()
}
