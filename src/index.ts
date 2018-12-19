import { readFile, writeFile } from 'fs'
import { basename } from 'path'
import { OutputChunk, OutputFile, OutputOptions, Plugin, VERSION } from 'rollup'
import { isFunction, isRegExp, promisify } from 'util'
import { gzip, ZlibOptions } from 'zlib'

export type StringMappingOption = (originalString: string) => string
export type CustomCompressionOption = (
    content: string | Buffer,
) => string | Buffer | Promise<string | Buffer>

export interface GzipPluginOptions {
    /**
     * Control which of the output files to compress
     *
     * Defaults to `/\.(js|json|css)$/`
     */
    filter?: RegExp | ((fileName: string) => boolean)

    /**
     * GZIP compression options, see https://nodejs.org/api/zlib.html#zlib_class_options
     */
    gzipOptions?: ZlibOptions

    /**
     * Specified the minimum size in Bytes for a file to get compressed.
     * Files that are smaller than this threshold will not be compressed.
     * This does not apply to the files specified through `additionalFiles`!
     */
    minSize?: number

    /**
     * This option allows you to compress additional files outside of the main rollup bundling process.
     * The processing is delayed to make sure the files are written on disk; the delay is controlled
     * through `additionalFilesDelay`.
     */
    additionalFiles?: string[]

    /**
     * This options sets a delay (ms) before the plugin compresses the files specified through `additionalFiles`.
     * Increase this value if your artifacts take a long time to generate.
     *
     * Defaults to `2000`
     */
    additionalFilesDelay?: number

    /**
     * Set a custom compression algorithm. The function can either return the compressed contents synchronously,
     * or otherwise return a promise for asynchronous processing.
     */
    customCompression?: CustomCompressionOption

    /**
     * Set a custom file name convention for the compressed files. Can be a suffix string or a function
     * returning the file name.
     *
     * Defaults to `.gz`
     */
    fileName?: string | StringMappingOption
}

const readFilePromise = promisify(readFile)
const writeFilePromise = promisify(writeFile)

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
    if (VERSION < '0.60.0') {
        console.error(
            '[rollup-plugin-gzip] This plugin supports rollup version >0.60.0!',
        )
        console.error(
            'For older rollup versions, please use version 1.x of this plugin.',
        )
    }

    // check for old options
    if ('algorithm' in options) {
        console.warn(
            '[rollup-plugin-gzip] The "algorithm" option is not supported any more! ' +
                'Use "customCompression" instead to specify a different compression algorithm.',
        )
    }
    if ('options' in options) {
        console.warn(
            '[rollup-plugin-gzip] The "options" option was renamed to "gzipOptions"!',
        )
    }
    if ('additional' in options) {
        console.warn(
            '[rollup-plugin-gzip] The "additional" option was renamed to "additionalFiles"!',
        )
    }
    if ('delay' in options) {
        console.warn(
            '[rollup-plugin-gzip] The "delay" option was renamed to "additionalFilesDelay"!',
        )
    }

    const compressGzip: CustomCompressionOption = fileContent => {
        return new Promise((resolve, reject) => {
            gzip(fileContent, options.gzipOptions || {}, (err, result) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })
    }

    const doCompress = options.customCompression || compressGzip

    const mapFileName: StringMappingOption = isFunction(options.fileName)
        ? (options.fileName as StringMappingOption)
        : (fileName: string) => fileName + (options.fileName || '.gz')

    const plugin: Plugin = {
        name: 'gzip',

        generateBundle(outputOptions, bundle, isWrite) {
            if (!isWrite) return

            // additional files are processed outside of rollup after a delay
            if (options.additionalFiles) {
                setTimeout(() => {
                    options.additionalFiles!.forEach(filePath => {
                        return readFilePromise(filePath)
                            .then(fileContent => doCompress(fileContent))
                            .then(compressedContent => {
                                return writeFilePromise(
                                    mapFileName(filePath),
                                    compressedContent,
                                )
                            })
                            .catch((err: any) => {
                                return Promise.reject(
                                    '[rollup-plugin-gzip] Error compressing additional file ' +
                                        filePath,
                                )
                            })
                    })
                }, options.additionalFilesDelay || 2000)
            }

            return Promise.all<Promise<any>>(
                Object.keys(bundle).map(fileName => {
                    const fileEntry = bundle[fileName]

                    // file name filter option check

                    const fileNameFilter = options.filter || /\.(js|mjs|json|css)$/

                    if (
                        isRegExp(fileNameFilter) &&
                        !fileName.match(fileNameFilter)
                    ) {
                        return Promise.resolve()
                    }

                    if (
                        isFunction(fileNameFilter) &&
                        !(fileNameFilter as (x: string) => boolean)(fileName)
                    ) {
                        return Promise.resolve()
                    }

                    const fileContent = getOutputFileContent(
                        fileName,
                        fileEntry,
                        outputOptions,
                    )

                    // minSize option check
                    if (
                        options.minSize &&
                        options.minSize > fileContent.length
                    ) {
                        return Promise.resolve()
                    }

                    return Promise.resolve(doCompress(fileContent))
                        .then(compressedContent => {
                            bundle[mapFileName(fileName)] = compressedContent
                        })
                        .catch((err: any) => {
                            console.error(err)
                            return Promise.reject(
                                '[rollup-plugin-gzip] Error compressing file ' +
                                    fileName,
                            )
                        })
                }),
            ) as Promise<any>
        },
    }

    return plugin
}

export default gzipPlugin
