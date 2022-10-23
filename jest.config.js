module.exports = {
  testEnvironment: 'node',
  watchPathIgnorePatterns: ['node_modules', '__output'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig-test.json',
      },
    ],
  },
}
