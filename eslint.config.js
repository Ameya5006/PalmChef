import tsParser from '@typescript-eslint/parser'

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' }
    },
    rules: {
      'no-debugger': 'error',
      'no-eval': 'error'
    }
  }
]
