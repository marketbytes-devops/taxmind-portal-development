const js = require('@eslint/js');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'drizzle.config.ts'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      'no-undef': 'off',
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    rules: {
      // Prettier integration
      ...prettier.rules,
    },
  },
];
