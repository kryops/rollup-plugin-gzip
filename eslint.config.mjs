// @ts-check

import eslint from '@eslint/js'
import jestPlugin from 'eslint-plugin-jest'
import { flatConfigs as importConfigs } from 'eslint-plugin-import'
import nodePlugin from 'eslint-plugin-n'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['**/node_modules', '**/dist', 'test/__output', '.yarn'],
  },
  {
    files: ['**/*.js', '**/*.ts'],

    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      nodePlugin.configs['flat/recommended-module'],
      jestPlugin.configs['flat/recommended'],
      importConfigs.recommended,
      importConfigs.typescript,
      eslintConfigPrettier,
    ],

    settings: {
      jest: {
        version: 29, // we actually use Vitest now
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: jestPlugin.environments.globals.globals,
    },

    rules: {
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-object-literal-type-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-extraneous-dependencies': ['error'],

      'import/order': [
        'error',
        {
          'newlines-between': 'always',
        },
      ],

      'jest/expect-expect': 'off',
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
    },
  },
  {
    files: ['**/*.js'],

    rules: {
      '@typescript-eslint/explicit-function-return-type': ['off'],
    },
  },
)
