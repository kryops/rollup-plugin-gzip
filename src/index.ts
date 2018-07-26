import { basename } from 'path'
import { OutputChunk, OutputFile, OutputOptions, Plugin } from 'rollup'
import { gzip, ZlibOptions } from 'zlib'

export interface GzipPluginOptions {
    options?: ZlibOptions
    additional?: string[]
    minSize?: number
    delay?: number

    // TODO add filter regex property so we can exclude chunks/assets
    // TODO add custom compressing algorithm
    // TODO add custom name convention
}

// functionality partially copied from rollup

/**
 * copied from https://github.com/rollup/rollup/blob/master/src/rollup/index.ts#L450
 */
function isOutputChunk(file: OutputFile): file is OutputChunk {
    return typeof (file as OutputChunk).code === 'string'
}

/**
 * Gets the string/buffer content from a file object.
 * Important for adding source map comments
 *
 * Copied partially from rollup.writeOutputFile
 * https://github.com/rollup/rollup/blob/master/src/rollup/index.ts#L454
 */
function getOutputFileContent(
    outputFileName: string,
    outputFile: OutputFile,
    outputOptions: OutputOptions,
): string | Buffer {
    if (isOutputChunk(outputFile)) {
        let source: string | Buffer
        source = outputFile.code
        if (outputOptions.sourcemap && outputFile.map) {
            const url =
                outputOptions.sourcemap === 'inline'
                    ? outputFile.map.toUrl()
                    : `${basename(outputFileName)}.map`

            // https://github.com/rollup/rollup/blob/master/src/utils/sourceMappingURL.ts#L1
            source += `//# source` + `MappingURL=${url}\n`
        }
        return source
    } else {
        return outputFile
    }
}

// actual plugin code

function gzipPlugin(options: GzipPluginOptions = {}): Plugin {
    // TODO implement plugin options

    const plugin: Plugin = {
        name: 'gzip',

        generateBundle(outputOptions, bundle, isWrite) {
            if (!isWrite) return

            return Promise.all(
                Object.keys(bundle).map(fileName => {
                    const fileEntry = bundle[fileName] as any

                    const fileContent = getOutputFileContent(
                        fileName,
                        fileEntry,
                        outputOptions,
                    )

                    return new Promise((resolve, reject) => {
                        gzip(fileContent, (err, result) => {
                            if (err) {
                                reject(
                                    '[rollup-plugin-gzip] Error compressing file ' +
                                        fileName,
                                )
                            } else {
                                bundle[fileName + '.gz'] = result
                                resolve()
                            }
                        })
                    })
                }),
            ) as Promise<any>
        },
    }

    return plugin
}

export default gzipPlugin
