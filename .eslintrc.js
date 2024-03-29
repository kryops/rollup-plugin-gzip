module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'jest'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:node/recommended-module',
    'plugin:import/typescript',
    'plugin:jest/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    jest: {
      // We use Vitest for testing now, but still use eslint-plugin-jest
      // as it is more mature and largely compatible.
      // As we don't have Jest installed any more, we need to set a fake version.
      version: 29,
    },
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
    'node/no-missing-import': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['off'],
      },
    },
  ],
}
