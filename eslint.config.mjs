import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import jest from 'eslint-plugin-jest'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  {
    ignores: ['**/coverage', '**/dist', '**/node_modules']
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended'
  ),
  {
    plugins: {
      jest,
      prettier,
      '@typescript-eslint': typescriptEslint
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '__tests__/*.ts',
            'eslint.config.mjs',
            'jest.config.js',
            'rollup.config.ts'
          ]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'prettier/prettier': 'error'
    }
  }
]
