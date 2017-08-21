export default {
    input: 'src/index.js',
    external: ['fs', 'zlib', 'node-zopfli'],

    output: [
        {
            format: 'cjs',
            file: 'lib/index.cjs.js'
        },
        {
            format: 'es',
            file: 'lib/index.es.js'
        }
    ]
}
