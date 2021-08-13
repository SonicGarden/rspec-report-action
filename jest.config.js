/* eslint-disable import/no-commonjs */
/* eslint-disable filenames/match-regex */
module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '\\.jsx?$': 'babel-jest',
    '^.+\\.ts$': 'ts-jest'
  },
  transformIgnorePatterns: ['/node_modules/(?!markdown-table).+\\.js'],
  verbose: true
}
