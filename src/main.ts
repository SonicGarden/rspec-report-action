import * as core from '@actions/core'
import * as fs from 'fs'
import glob from 'fast-glob'
import {parse} from './parse'
import {reportSummary} from './report-summary'

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

    const result = parse(jsonPaths)
    core.info(result.summary)

    if (!result.success) {
      await reportSummary(result)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
