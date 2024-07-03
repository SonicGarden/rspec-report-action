import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'
import glob from 'fast-glob'
import {parse} from './parse'
import {reportSummary} from './report-summary'
import {reportComment} from './report-comment'

async function run(): Promise<void> {
  try {
    const globPath = core.getInput('json-path', {required: true})

    let jsonPaths = await glob(globPath, {dot: true})
    jsonPaths = jsonPaths.filter(jsonPath => {
      try {
        fs.accessSync(jsonPath, fs.constants.R_OK)
        return true
      } catch (err) {
        core.warning(`${jsonPath}: access error!`)
        return false
      }
    })

    const result = await parse(jsonPaths)
    core.info(result.summary)

    if (!result.success) {
      await reportSummary(result)
    }

    const isCommentEnabled = core.getInput('comment') === 'true'
    const pullRequestNumber =
      core.getInput('pull-request-id') || github.context.issue.number

    if (isCommentEnabled && pullRequestNumber) {
      await reportComment(result)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

export default run
if (require.main === module) {
  run()
}
