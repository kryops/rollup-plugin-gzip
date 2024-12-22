import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1,
      },
    },
  },
})
