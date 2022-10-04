import * as path from 'path'
import * as core from '@actions/core'
import {reportSummary} from '../src/report-summary'
import run from '../src/main'

import {expect, jest, test} from '@jest/globals'

jest.mock('@actions/core')
jest.mock('../src/report-summary')
const mockedCore = jest.mocked(core)

test('Parse multiple rspec json results', async () => {
  mockedCore.getInput.mockReturnValue(path.resolve(__dirname, '../.dummy_results-*.json'))
  await run()
  expect(reportSummary).toHaveBeenCalledWith({
    examples: expect.any(Array),
    summary: '50 examples, 2 failures',
    success: false
  })
})
