import { defineConfig } from 'vite'

import gzip from './dist/index'

export default defineConfig({
  root: 'test/sample',
  plugins: [gzip()],
})
