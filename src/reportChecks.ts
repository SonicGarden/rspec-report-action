import * as core from '@actions/core'
import * as github from '@actions/github'
import type {RspecResult} from './parse'
import {example2Table} from './table'

export const reportChecks = async (result: RspecResult): Promise<void> => {
  const icon = result.success ? ':tada:' : ':cold_sweat:'
  const summary = `${icon} ${result.summary}

${example2Table(result.examples)}
`

  await github
    .getOctokit(core.getInput('token', {required: true}))
    .checks.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      name: 'RSpec Result',
      head_sha: github.context.sha,
      status: 'completed',
      conclusion: result.success ? 'success' : 'failure',
      output: {
        title: 'RSpec Result',
        summary
      }
    })
}
