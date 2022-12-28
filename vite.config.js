import { defineConfig } from 'vite'

import gzip from './dist-es/index'

export default defineConfig({
  root: 'test/sample',
  plugins: [gzip()],
})
