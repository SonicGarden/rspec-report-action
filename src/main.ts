import * as core from '@actions/core'
import * as fs from 'fs'
import * as github from '@actions/github'
import {parse} from './parse'
import {reportChecks} from './report-checks'
import {reportPR} from './report-pr'

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
    core.info(result.summary)

    const report = github.context.issue.number ? reportPR : reportChecks
    await report(result)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
