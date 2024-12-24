import * as path from 'path'
import {parse} from '../src/parse'
import {expect, test} from '@jest/globals'

test('Parse rspec result json', async () => {
  const result = await parse([
    path.resolve(__dirname, '../.dummy_results-0.json')
  ])
  expect(result).toEqual({
    summary: '25 examples, 1 failure',
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
    totalTime: 0.294507,
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
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 71,
        description:
          'ActiveRecord::Validations::BlobValidator with content_type option array is expected to eq false',
        runTime: 0.009572
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 55,
        description:
          'ActiveRecord::Validations::BlobValidator with content_type option regexp is expected to eq false',
        runTime: 0.009186
      }
    ]
  })
})
