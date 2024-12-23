import * as path from 'path'
import * as core from '@actions/core'
import {reportSummary} from '../src/report-summary'
import run from '../src/main'

import {expect, jest, test} from '@jest/globals'

jest.mock('@actions/core')
jest.mock('../src/report-summary')
const mockedCore = jest.mocked(core)

test('Parse multiple rspec json results', async () => {
  mockedCore.getInput.mockReturnValue(
    path.resolve(__dirname, '../.dummy_results-*.json')
  )
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
    summary: '27 examples, 1 failure, 1 pending',
    totalTime: 0.35526800000000003,
    slowExamples: [
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 11,
        description:
          'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq true',
        runTime: 0.044519
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 11,
        description:
          'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq true',
        runTime: 0.044519
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 37,
        description:
          'ActiveRecord::Validations::BlobValidator with size_range option 1.4MB is expected to eq true',
        runTime: 0.038474
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 10,
        description:
          'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq false',
        runTime: 0.016242
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 10,
        description:
          'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq false',
        runTime: 0.016242
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 36,
        description:
          'ActiveRecord::Validations::BlobValidator with size_range option 1.4MB is expected to eq false',
        runTime: 0.015013
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 39,
        description:
          "ActiveRecord::Validations::BlobValidator with size_range option 1.4MB should translate the validation error according to it's locale",
        runTime: 0.015001
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 80,
        description:
          'ActiveRecord::Validations::BlobValidator with content_type option symbol is expected to eq true',
        runTime: 0.011655
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 54,
        description:
          'ActiveRecord::Validations::BlobValidator with content_type option regexp is expected to eq true',
        runTime: 0.009849
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 68,
        description:
          'ActiveRecord::Validations::BlobValidator with content_type option array is expected to eq false',
        runTime: 0.00981
      }
    ]
  })
})
