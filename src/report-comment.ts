import * as core from '@actions/core'
import * as github from '@actions/github'
import type {RspecResult} from './parse'
import replaceComment, {deleteComment} from '@aki77/actions-replace-comment'

const MAX_TABLE_ROWS = 30

export async function examples2Table(
  examples: RspecResult['examples']
): Promise<string> {
  const {markdownTable} = await import('markdown-table')

  return markdownTable([
    ['Example', 'Description', 'Message'],
    ...examples
      .slice(0, MAX_TABLE_ROWS)
      .map(({filePath, lineNumber, description, message}) => [
        [filePath, lineNumber].join(':'),
        description,
        message.replace(/\\n/g, ' ').trim().replace(/\s+/g, '&nbsp;')
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

export const reportComment = async (result: RspecResult): Promise<void> => {
  const title = core.getInput('title', {required: true})

  if (result.success) {
    await deleteComment({
      ...commentGeneralOptions(),
      body: title,
      startsWith: true
    })
    return
  }

  await replaceComment({
    ...commentGeneralOptions(),
    body: `${title}
<details>
<summary>${result.summary}</summary>

${await examples2Table(result.examples)}

</details>
`
  })
}
