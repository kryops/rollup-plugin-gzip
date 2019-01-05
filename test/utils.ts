import * as fs from 'fs'
import * as rimraf from 'rimraf'
import { promisify } from 'util'
import * as zlib from 'zlib'

const writeFilePromise = promisify(fs.writeFile)
const createDirPromise = promisify(fs.mkdir)

export function cleanup() {
    return new Promise(resolve => {
        rimraf('test/__output/**', () => resolve())
    })
}

export function fileNotPresent(path: string) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (!err) reject('File should not be present: ' + path)
            resolve()
        })
    })
}

export function compareFileWithGzip(path: string, extension?: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, bundleContent) => {
            if (err) {
                reject('Bundle not found! ' + path)
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
    return createDirPromise('test/__output').then(() =>
        Promise.all(files.map(file => writeFilePromise(file[0], file[1]))),
    )
}

export function delay(ms = 2500) {
    return new Promise((resolve, reject) => setTimeout(() => resolve(), ms))
}
