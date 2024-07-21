import { defineConfig } from 'vite'

import gzip from './dist/index.js'

export default defineConfig({
  root: 'test/sample',
  plugins: [gzip()],
})
