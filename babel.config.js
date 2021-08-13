/* eslint-disable filenames/match-regex,import/no-commonjs */
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ]
  ],
  plugins: ['@babel/plugin-transform-modules-commonjs']
}
