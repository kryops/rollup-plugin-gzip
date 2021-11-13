import * as fs from 'fs'
import { join } from 'path'
import { dirname } from 'path'
import { promisify } from 'util'
import * as zlib from 'zlib'

import * as rimraf from 'rimraf'
import * as rollup from 'rollup'
import * as vite from 'vite'

import gzip from '../dist/index'
import { GzipPluginOptions } from '../src/index'

const writeFilePromise = promisify(fs.writeFile)
const createDirPromise = promisify(fs.mkdir)

export function cleanup() {
    return new Promise<void>(resolve => {
        rimraf('test/__output/**', () => resolve())
    }).then(() => createDirPromise('test/__output', { recursive: true }))
}

export function sampleRollup(
    options?: GzipPluginOptions,
    plugins: rollup.Plugin[] = [],
) {
    return rollup
        .rollup({
            input: 'test/sample/index.js',
            plugins: [...plugins, gzip(options)],
        })
        .then(bundle => {
            return bundle
                .write({
                    file: 'test/__output/bundle.js',
                    format: 'iife',
                    sourcemap: true,
                })
                .then(() => 'bundle.js')
        })
}

export function sampleVite(
    options?: GzipPluginOptions,
    plugins: rollup.Plugin[] = [],
) {
    return vite
        .build({
            root: join(__dirname, './sample'),
            plugins: [...plugins, gzip(options)],
            build: {
                outDir: join(__dirname, './__output'),
                sourcemap: true,
            },
            logLevel: 'error',
        })
        .then(result => {
            if ('output' in result) {
                const asset = result.output.find(chunk =>
                    chunk.fileName.endsWith('.js'),
                )
                return asset?.fileName
            }
            throw new Error('Could not find output asset')
        })
}

export function fileNotPresent(path: string) {
    return new Promise<void>((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (!err) reject('File should not be present: ' + path)
            resolve()
        })
    })
}

export function compareFileWithGzip(path: string, extension?: string) {
    return new Promise<void>((resolve, reject) => {
        fs.readFile(path, (err, bundleContent) => {
            if (err) {
                const filesPresent = fs.readdirSync(dirname(path))
                reject(
                    `Bundle not found! ${path} - files present: ${filesPresent.join(
                        ', ',
                    )}`,
                )
                return
            }

            fs.readFile(path + (extension || '.gz'), (err2, gzipContent) => {
                if (err2) {
                    reject('Gzip file not found! ' + path)
                    return
                }

                zlib.gunzip(gzipContent, (_err2, unzippedContent) => {
                    expect(unzippedContent.toString()).toEqual(
                        bundleContent.toString(),
                    )
                    resolve()
                })
            })
        })
    })
}

export function writeFiles(files: Array<[string, string]>) {
    return createDirPromise('test/__output', { recursive: true }).then(() =>
        Promise.all(files.map(file => writeFilePromise(file[0], file[1]))),
    )
}

export function delay(ms = 2500) {
    return new Promise<void>((resolve, reject) =>
        setTimeout(() => resolve(), ms),
    )
}

export function getChunk(chunks: string[], name: string): string {
    const chunk = chunks.find(
        it => it.startsWith(name) || it.includes('/' + name),
    )

    if (!chunk) throw new Error('Chunk ' + chunk + ' not found!')

    return chunk
}

export async function expectCompressedChunks(
    allChunks: string[],
    compressedNames: string[],
) {
    const compressedChunks = compressedNames.map(name =>
        getChunk(allChunks, name),
    )

    await Promise.all(
        allChunks.map(chunk => {
            if (compressedChunks.includes(chunk)) {
                return compareFileWithGzip('test/__output/' + chunk)
            } else {
                return fileNotPresent('test/__output/' + chunk + '.gz')
            }
        }),
    )
}
