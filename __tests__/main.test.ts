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
    examples: [
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 37,
        description:
            'ActiveRecord::Validations::BlobValidator with size_range option 1.4MB is expected to eq true',
        message: '\\nexpected: true\\n     got: false\\n\\n(compared using ==)'
      }
    ],
    success: false,
    summary: '27 examples, 1 failure, 1 pending'
  })
})
