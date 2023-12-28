import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1,
      },
    },
  },
})
