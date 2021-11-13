import * as fs from 'fs'
import { basename, dirname, join } from 'path'
import { promisify } from 'util'
import { gzip, ZlibOptions } from 'zlib'

import {
  OutputAsset,
  OutputChunk,
  OutputOptions,
  Plugin,
  VERSION,
} from 'rollup'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const gzipPromise = promisify(gzip)

const isFunction = (arg: unknown): arg is (...args: any[]) => any =>
  typeof arg === 'function'
const isRegExp = (arg: unknown): arg is RegExp =>
  Object.prototype.toString.call(arg) === '[object RegExp]'

export type StringMappingOption = (originalString: string) => string
export type CustomCompressionOption = (
  content: string | Buffer,
) => string | Buffer | Promise<string | Buffer>

export interface GzipPluginOptions {
  /**
   * Control which of the output files to compress
   *
   * Defaults to `/\.(js|mjs|json|css|html)$/`
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
   * Defaults to `0`
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

// functionality partially copied from rollup

/**
 * copied from https://github.com/rollup/rollup/blob/master/src/rollup/index.ts#L450
 */
function isOutputChunk(file: OutputAsset | OutputChunk): file is OutputChunk {
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
  outputFile: OutputAsset | OutputChunk,
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
    return typeof outputFile.source === 'string'
      ? outputFile.source
      : // just to be sure, as it is typed string | Uint8Array in rollup 2.0.0
        Buffer.from(outputFile.source)
  }
}

// actual plugin code

function performInitChecks(options: GzipPluginOptions) {
  if (VERSION < '2.0.0') {
    console.error(
      '[rollup-plugin-gzip] This plugin supports rollup version >= 2.0.0!',
    )
    console.error(
      'For older rollup versions, please use an older version of this plugin.',
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
}

function gzipPlugin(explicitOptions: GzipPluginOptions = {}): Plugin {
  performInitChecks(explicitOptions)

  const options: Required<GzipPluginOptions> = {
    // default options
    filter: /\.(js|mjs|json|css|html)$/,
    fileName: '.gz',
    customCompression: (fileContent: string | Buffer) =>
      gzipPromise(fileContent, options.gzipOptions),
    gzipOptions: {},
    additionalFiles: [],
    additionalFilesDelay: 0,
    minSize: 0,

    ...explicitOptions,
  }

  const mapFileName: StringMappingOption = isFunction(options.fileName)
    ? (options.fileName as StringMappingOption)
    : (fileName: string) => fileName + options.fileName

  const plugin: Plugin = {
    name: 'gzip',

    async writeBundle(outputOptions, bundle) {
      const outputDir = outputOptions.file
        ? dirname(outputOptions.file)
        : outputOptions.dir || ''

      const compressBundleFile = async (fileName: string) => {
        const fileEntry = bundle[fileName]

        // filter check
        if (isRegExp(options.filter) && !fileName.match(options.filter)) {
          return Promise.resolve()
        }

        if (
          isFunction(options.filter) &&
          !(options.filter as (x: string) => boolean)(fileName)
        ) {
          return Promise.resolve()
        }

        const fileContent = getOutputFileContent(
          fileName,
          fileEntry,
          outputOptions,
        )

        // minSize option check
        if (options.minSize && options.minSize > fileContent.length) {
          return Promise.resolve()
        }

        try {
          await writeFile(
            join(outputDir, mapFileName(fileName)),
            await options.customCompression(fileContent),
          )
        } catch (error) {
          console.error(error)
          return Promise.reject(
            '[rollup-plugin-gzip] Error compressing file ' + fileName,
          )
        }
      }

      const compressAdditionalFile = async (filePath: string) => {
        try {
          const fileContent = await readFile(filePath)
          await writeFile(
            mapFileName(filePath),
            await options.customCompression(fileContent),
          )
          return Promise.resolve()
        } catch (error) {
          console.error(error)
          return Promise.reject(
            '[rollup-plugin-gzip] Error compressing additional file ' +
              filePath +
              '. Please check the spelling of your configured additionalFiles. ' +
              'You might also have to increase the value of the additionalFilesDelay option.',
          )
        }
      }

      const promises: Promise<any>[] =
        Object.keys(bundle).map(compressBundleFile)

      if (!options.additionalFilesDelay) {
        promises.push(...options.additionalFiles.map(compressAdditionalFile))
      } else {
        // if a delay is set, we do not await the compression of additional files
        setTimeout(
          () => options.additionalFiles.map(compressAdditionalFile),
          options.additionalFilesDelay,
        )
      }

      await Promise.all(promises)
    },

    // vite options
    ...({
      apply: 'build',
      enforce: 'post',
    } as any),
  }

  return plugin
}

export default gzipPlugin
