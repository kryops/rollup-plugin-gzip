import gzipPlugin from 'rollup-plugin-gzip'

export default {
    input: 'src/index.js',
    output: {
        format: 'cjs',
        file: 'dist/bundle.js',
    },
    plugins: [gzipPlugin()],
}
