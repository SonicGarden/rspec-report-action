import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, jest, test } from '@jest/globals'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const getInput = jest.fn<(name: string) => string>()
const info = jest.fn()
const warning = jest.fn()
const setFailed = jest.fn()

jest.unstable_mockModule('@actions/core', () => ({
  getInput,
  info,
  warning,
  setFailed,
  debug: jest.fn(),
  setOutput: jest.fn()
}))

const reportSummary = jest.fn()
jest.unstable_mockModule('../src/report-summary.js', () => ({
  reportSummary
}))

const { run } = await import('../src/main.js')

test('Parse multiple rspec json results', async () => {
  getInput.mockReturnValue(path.resolve(__dirname, '../.dummy_results-*.json'))
  await run()

  expect(reportSummary).toHaveBeenCalledWith({
    examples: [
      {
        filePath: 'spec/models/user_spec.rb',
        lineNumber: 18,
        description:
          'User validations is expected to validate that :email cannot be empty',
        message: '\nexpected: true\n     got: false\n\n(compared using ==)',
        backtrace: [
          "./spec/models/user_spec.rb:18:in `block (3 levels) in <top (required)>'",
          "./app/models/user.rb:24:in `valid?'"
        ]
      },
      {
        filePath: 'spec/services/payment_service_spec.rb',
        lineNumber: 42,
        description:
          'PaymentService#charge raises an error when the gateway is unreachable',
        message:
          'Payment gateway returned an unexpected response.\n\nThe gateway responded with HTTP 502 (Bad Gateway) while attempting to\nauthorize the charge. This usually means the upstream processor is\ntemporarily unavailable. Retrying the request did not resolve the issue\nwithin the configured timeout of 30 seconds.\n\nRequest ID: req_0123456789abcdef',
        backtrace: [
          "./spec/services/payment_service_spec.rb:42:in `block (2 levels) in <top (required)>'",
          "./app/services/payment_service.rb:58:in `charge'",
          "./lib/gateways/stripe_gateway.rb:31:in `authorize'"
        ]
      },
      {
        filePath: 'spec/requests/orders_spec.rb',
        lineNumber: 73,
        description: 'GET /orders calculates the total amount',
        message: "undefined method `total_amount' for nil:NilClass",
        backtrace: [
          "./spec/requests/orders_spec.rb:73:in `block (2 levels) in <top (required)>'",
          "./app/controllers/orders_controller.rb:19:in `index'"
        ]
      }
    ],
    success: false,
    summary: '12 examples, 3 failures, 1 pending',
    totalTime: 0.7077779999999999,
    slowExamples: [
      {
        filePath: 'spec/services/payment_service_spec.rb',
        lineNumber: 42,
        description:
          'PaymentService#charge raises an error when the gateway is unreachable',
        runTime: 0.156789
      },
      {
        filePath: 'spec/requests/orders_spec.rb',
        lineNumber: 73,
        description: 'GET /orders calculates the total amount',
        runTime: 0.123456
      },
      {
        filePath: 'spec/requests/orders_spec.rb',
        lineNumber: 12,
        description: 'GET /orders returns a list of orders',
        runTime: 0.098765
      },
      {
        filePath: 'spec/models/user_spec.rb',
        lineNumber: 18,
        description:
          'User validations is expected to validate that :email cannot be empty',
        runTime: 0.087654
      },
      {
        filePath: 'spec/requests/orders_spec.rb',
        lineNumber: 89,
        description: 'GET /orders requires authentication',
        runTime: 0.056789
      },
      {
        filePath: 'spec/services/payment_service_spec.rb',
        lineNumber: 67,
        description: 'PaymentService#charge records the transaction',
        runTime: 0.045678
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 11,
        description:
          'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq true',
        runTime: 0.044519
      },
      {
        filePath: 'spec/services/payment_service_spec.rb',
        lineNumber: 21,
        description: 'PaymentService#charge charges the customer',
        runTime: 0.034567
      },
      {
        filePath: 'spec/models/user_spec.rb',
        lineNumber: 31,
        description: 'User callbacks downcases the email before saving',
        runTime: 0.021098
      },
      {
        filePath: 'spec/activestorage/validator/blob_spec.rb',
        lineNumber: 10,
        description:
          'ActiveRecord::Validations::BlobValidator presence: true has_one_attached is expected to eq false',
        runTime: 0.016242
      }
    ]
  })
})
