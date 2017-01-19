export default {
    entry: 'src/index.js',
    external: ['fs', 'zlib'],

    targets: [
        {
            format: 'cjs',
            dest: 'lib/index.cjs.js'
        },
        {
            format: 'es',
            dest: 'lib/index.es.js'
        }
    ]
}
