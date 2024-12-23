import * as core from '@actions/core'
import * as github from '@actions/github'
import type {RspecResult} from './parse'
import replaceComment from '@aki77/actions-replace-comment'

export async function examples2Table(
  examples: RspecResult['slowExamples']
): Promise<string> {
  const {markdownTable} = await import('markdown-table')

  return markdownTable([
    ['Example', 'Description', 'Time in seconds'],
    ...examples.map(({filePath, lineNumber, description, runTime}) => [
      [filePath, lineNumber].join(':'),
      description,
      String(runTime)
    ])
  ])
}

type CommentGeneralOptions = {
  token: string
  owner: string
  repo: string
  issue_number: number
}

const commentGeneralOptions = (): CommentGeneralOptions => {
  const pullRequestId = github.context.issue.number
  if (!pullRequestId) {
    throw new Error('Cannot find the PR id.')
  }

  return {
    token: core.getInput('token', {required: true}),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId
  }
}

const slowestExamplesSummary = (result: RspecResult): string => {
  const totalTime = result.totalTime
  const slowTotalTime = result.slowExamples.reduce(
    (total, {runTime}) => total + runTime,
    0
  )
  const percentage = (slowTotalTime / totalTime) * 100
  // eslint-disable-next-line i18n-text/no-en
  return `Top ${result.slowExamples.length} slowest examples (${slowTotalTime} seconds, ${percentage}% of total time)`
}

export const reportProfileComment = async (
  result: RspecResult
): Promise<void> => {
  const title = core.getInput('profileTitle', {required: true})
  const summary = slowestExamplesSummary(result)

  await replaceComment({
    ...commentGeneralOptions(),
    body: `${title}
<details>
<summary>${summary}</summary>

${await examples2Table(result.slowExamples)}

</details>
`
  })
}
