import { brotliCompress } from 'zlib'
import { promisify } from 'util'

import gzipPlugin from 'rollup-plugin-gzip'
import { gzipAsync } from '@gfx/zopfli'

const brotliPromise = promisify(brotliCompress)

export default {
  input: 'src/index.js',
  output: {
    format: 'cjs',
    file: 'dist/bundle.js',
  },
  plugins: [
    gzipPlugin({
      customCompression: content => brotliPromise(Buffer.from(content)),
      fileName: '.br',
    }),
    gzipPlugin({
      customCompression: content =>
        gzipAsync(Buffer.from(content), { numiterations: 15 }),
    }),
  ],
}
