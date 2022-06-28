import * as path from 'path'
import {parse} from '../src/parse'
import {expect, test} from '@jest/globals'

test('Parse rspec result json', async () => {
  const result = parse(path.resolve(__dirname, '../.dummy_results.json'))
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
    success: false
  })
})
