/* eslint-disable node/no-unsupported-features/node-builtins */
import fs from 'fs'

import gzipPlugin from 'rollup-plugin-gzip'

export default {
  input: 'src/index.js',
  output: {
    format: 'cjs',
    file: 'dist/bundle.js',
  },
  plugins: [
    {
      name: 'pluginThatWritesFiles',
      generateBundle(outputOptions, bundle, isWrite) {
        if (!isWrite) return
        return fs.promises
          .mkdir('dist', { recursive: true })
          .then(() => fs.promises.writeFile('dist/foo.css', '.foo { bar: 1; }'))
      },
    },
    gzipPlugin({
      gzipOptions: {
        level: 9,
      },
      additionalFiles: ['dist/foo.css'],
    }),
  ],
}
