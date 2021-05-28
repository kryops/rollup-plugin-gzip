import * as fs from 'fs'
import { dirname } from 'path'
import { promisify } from 'util'
import * as zlib from 'zlib'

import * as rimraf from 'rimraf'
import * as rollup from 'rollup'

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
            return bundle.write({
                file: 'test/__output/bundle.js',
                format: 'iife',
                sourcemap: true,
            })
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
