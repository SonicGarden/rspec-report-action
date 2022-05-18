import * as core from '@actions/core'
import * as github from '@actions/github'
import type {RspecResult} from './parse'

export const reportSummary = async (result: RspecResult): Promise<void> => {
  const icon = result.success ? ':tada:' : ':cold_sweat:'
  const summary = `${icon} ${result.summary}`
  const baseUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${github.context.sha}`

  const rows = result.examples.map(
    ({filePath, lineNumber, description, message}) => [
      `\n\n[${filePath}:${lineNumber}](${baseUrl}/${filePath}#L${lineNumber})`,
      description,
      message.replace(/\n+/g, ' ')
    ]
  )

  await core.summary
    .addHeading('RSpec Result')
    .addRaw(summary)
    .addTable([
      [
        {data: 'Example :link:', header: true},
        {data: 'Description :pencil2:', header: true},
        {data: 'Message :x:', header: true}
      ],
      ...rows
    ])
    .write()
}
