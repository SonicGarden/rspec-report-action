import * as core from '@actions/core'
import * as github from '@actions/github'
import type {RspecResult} from './parse'

const FOOTER_LINK =
  // eslint-disable-next-line i18n-text/no-en
  'Reported by [rspec-report-action](https://github.com/SonicGarden/rspec-report-action)'

const formatMessage = (message: string): string => {
  const lines = message
    .replace(/\\n/g, '\n')
    .trim()
    .replace(/ /g, '&nbsp;')
    .split(/\n/)
  const [summary, ...bodyLines] = lines
  return `<details>
<summary>${summary}</summary>

${bodyLines.join('<br>')}
</details>
`
}

export const reportSummary = async (result: RspecResult): Promise<void> => {
  const icon = result.success ? ':tada:' : ':cold_sweat:'
  const summary = `${icon} ${result.summary}`
  const baseUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${github.context.sha}`

  const rows = result.examples.map(
    ({filePath, lineNumber, description, message}) => [
      `\n\n[${filePath}:${lineNumber}](${baseUrl}/${filePath}#L${lineNumber})`,
      description,
      formatMessage(message)
    ]
  )

  const hideFooterLink = core.getInput('hideFooterLink') === 'true'

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
    .addRaw(hideFooterLink ? '' : `\n${FOOTER_LINK}`)
    .write()
}
