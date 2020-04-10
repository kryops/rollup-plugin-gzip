import { brotliCompressSync } from 'zlib'
import gzipPlugin from 'rollup-plugin-gzip'
import { gzipAsync } from '@gfx/zopfli'

export default {
    input: 'src/index.js',
    output: {
        format: 'cjs',
        file: 'dist/bundle.js',
    },
    plugins: [
        gzipPlugin({
            customCompression: content =>
                brotliCompressSync(Buffer.from(content)),
            fileName: '.br',
        }),
        gzipPlugin({
            customCompression: content =>
                gzipAsync(Buffer.from(content), { numiterations: 15 }),
        }),
    ],
}
