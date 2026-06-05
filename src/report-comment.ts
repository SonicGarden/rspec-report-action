import * as core from '@actions/core'
import * as github from '@actions/github'
import type { RspecResult } from './parse.js'
import { buildBaseUrl, formatFailureList } from './format.js'
import replaceComment, { deleteComment } from '@aki77/actions-replace-comment'

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
    token: core.getInput('token', { required: true }),
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: pullRequestId
  }
}

export const reportComment = async (result: RspecResult): Promise<void> => {
  const title = core.getInput('title', { required: true })

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

${result.summary}

${formatFailureList(result.examples, buildBaseUrl())}
`
  })
}
