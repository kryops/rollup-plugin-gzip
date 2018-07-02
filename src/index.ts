import * as fs from 'fs'
import * as path from 'path'
import { Plugin, VERSION } from 'rollup'
import { ZlibOptions } from 'zlib'

export interface GzipPluginOptions {
    algorithm?: string
    options?: ZlibOptions
    additional?: string[]
    minSize?: number
    delay?: number
}

function gzipCompressFile(
    file: string,
    algorithm: string,
    options: ZlibOptions | undefined,
    minSize: number,
): Promise<void> {
    return new Promise(resolve => {
        fs.stat(file, (err, stats) => {
            if (err) {
                console.error('rollup-plugin-gzip: Error reading file ' + file)
                resolve()
                return
            }

            if (minSize && minSize > stats.size) {
                resolve()
            } else {
                const compressor: typeof import('zlib') =
                    algorithm === 'zopfli'
                        ? require('node-zopfli')
                        : require('zlib')

                fs.createReadStream(file)
                    .pipe(compressor.createGzip(options))
                    .pipe(fs.createWriteStream(file + '.gz'))
                    .on('close', () => resolve())
            }
        })
    })
}

function gzipPlugin(options: GzipPluginOptions = {}): Plugin {
    const algorithm = options.algorithm || 'zlib'
    const gzipOptions = options.options
    const additionalFiles = options.additional || []
    const minSize = options.minSize || 0

    let delay = options.delay || 0

    if (
        options.delay === undefined &&
        options.additional &&
        VERSION >= '0.60.0' /* && VERSION <= '0.62.0' */
    ) {
        delay = 5000
        console.warn(
            '[rollup-plugin-gzip] This version of rollup does not guarantee that plugins are executed in the right order!',
        )
        console.warn(
            'As you have specified additional resources to be compressed, we assume a default delay of 5000ms.',
        )
        console.warn('To change, set a "delay" value for this plugin.')
    }

    const doCompress = (filesToCompress: string[]): Promise<any> =>
        new Promise(resolve => {
            setTimeout(() => {
                resolve(
                    Promise.all(
                        filesToCompress.map(file =>
                            gzipCompressFile(
                                file,
                                algorithm,
                                gzipOptions,
                                minSize,
                            ),
                        ),
                    ),
                )
            }, delay)
        })

    const plugin: Plugin = {
        name: 'gzip',

        onwrite(buildOpts) {
            // fallback to .dest for rollup < 0.48
            const outBundle = buildOpts.file || buildOpts.dest

            const bundleFiles = outBundle ? [outBundle] : []

            // we have to read from the actual written bundle file rather than use bundle.code
            // as it does not contain the source map comment
            const filesToCompress = bundleFiles.concat(additionalFiles)

            if (!filesToCompress.length) return

            return doCompress(filesToCompress)
        },

        // experimental support for code splitting
        generateBundle(outputOptions, bundle, isWrite) {
            if (!isWrite) return
            if (!outputOptions.dir || outputOptions.file) return

            // we set a delay because we don't know when the files will be written :-/
            if (options.delay === undefined && delay < 1000) {
                delay = 1000
            }

            const bundleFiles: string[] = []

            Object.keys(bundle).forEach(id => {
                bundleFiles.push(path.join(outputOptions.dir!, id))
            })

            const filesToCompress = bundleFiles.concat(additionalFiles)

            if (!filesToCompress.length) return

            doCompress(filesToCompress)

            // we have to resolve immediately, because otherwise the files will not be written no matter what delay we have set
            return Promise.resolve()
        },
    }

    return plugin
}

export default gzipPlugin
