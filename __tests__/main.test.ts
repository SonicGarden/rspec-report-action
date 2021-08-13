import * as path from 'path'
import {parse} from '../src/parse'
import {example2Table} from '../src/table'
import {expect, test} from '@jest/globals'

test('Parse rspec result json', async () => {
  const result = await parse(path.resolve(__dirname, '../.dummy_results.json'))
  expect(result).toEqual({
    summary: '25 examples, 1 failure',
    examples: [
      {
        example: './spec/activestorage/validator/blob_spec.rb:37',
        description:
          'ActiveRecord::Validations::BlobValidator with size_range option 1.4MB is expected to eq true',
        message: '\nexpected: true\n     got: false\n\n(compared using ==)'
      }
    ],
    success: false
  })
})

test('example2Table', () => {
  const examples = [
    {
      example: './dummy_spec.rb:1',
      description: 'dummy',
      message: 'error!\nerror!'
    }
  ]
  expect(example2Table(examples))
    .toEqual(`| Example           | Description | Message       |
| ----------------- | ----------- | ------------- |
| ./dummy_spec.rb:1 | dummy       | error! error! |`)
})
