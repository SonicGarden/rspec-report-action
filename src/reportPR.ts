import * as core from '@actions/core'
import * as github from '@actions/github'
import replaceComment, {deleteComment} from '@aki77/actions-replace-comment'
import type {RspecResult} from './parse'
import {example2Table} from './table'

const TITLE = '# :cold_sweat: RSpec failure'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const commentGeneralOptions = () => {
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

export const reportPR = async (result: RspecResult): Promise<void> => {
  const pullRequestId = github.context.issue.number
  if (!pullRequestId) {
    throw new Error('Cannot find the PR id.')
  }

  if (result.success) {
    await deleteComment({
      ...commentGeneralOptions(),
      body: TITLE,
      startsWith: true
    })
    return
  }

  await replaceComment({
    ...commentGeneralOptions(),
    body: `${TITLE}
<details>
<summary>${result.summary}</summary>

${example2Table(result.examples)}

</details>
`
  })
}
