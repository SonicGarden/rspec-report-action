import * as core from '@actions/core'
import type { RspecResult } from './parse.js'
import { buildBaseUrl, formatFailureList } from './format.js'

const FOOTER_LINK =
  'Reported by [rspec-report-action](https://github.com/SonicGarden/rspec-report-action)'

export const reportSummary = async (result: RspecResult): Promise<void> => {
  const icon = result.success ? ':tada:' : ':cold_sweat:'
  const summary = `${icon} ${result.summary}`
  const hideFooterLink = core.getInput('hideFooterLink') === 'true'

  await core.summary
    .addHeading('RSpec Result')
    .addRaw(summary)
    .addRaw(`\n\n${formatFailureList(result.examples, buildBaseUrl())}\n`)
    .addRaw(hideFooterLink ? '' : `\n${FOOTER_LINK}`)
    .write()
}
