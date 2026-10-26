import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const boundary = (patterns, message) => ['error', { patterns: [{ group: patterns, message }] }]

export default defineConfig([
  globalIgnores(['dist']),
  prettier,
  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [js.configs.recommended],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'no-nested-ternary': 'error',
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/api/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': boundary(
        ['**/components', '**/components/**', '**/pages', '**/pages/**', '**/hooks', '**/hooks/**'],
        'API modules must not depend on UI components, pages, or hooks.',
      ),
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': boundary(
        ['**/pages', '**/pages/**', '../api/**', '../../api/**', '**/src/api/**'],
        'Pass data and callbacks as props; shared components must not import pages or API modules.',
      ),
    },
  },
])
