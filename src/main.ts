import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'
import replaceComment, {deleteComment} from '@aki77/actions-replace-comment'
import {parse} from './parse'
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

async function run(): Promise<void> {
  try {
    const jsonPath = core.getInput('json-path', {required: true})

    try {
      fs.accessSync(jsonPath, fs.constants.R_OK)
    } catch (err) {
      core.warning(`${jsonPath}: access error!`)
      return
    }

    const result = parse(jsonPath)
    if (result.examples.length === 0) {
      await deleteComment({
        ...commentGeneralOptions(),
        body: TITLE,
        startsWith: true
      })
      core.info(result.summary)
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
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
