import * as fs from 'fs'
import * as zlib from 'zlib'
import { promisify } from 'util'
import test from 'ava'
import rimraf from 'rimraf'
import * as rollup from 'rollup'
import gzip from '../dist/index'

const writeFilePromise = promisify(fs.writeFile)
const createDirPromise = promisify(fs.mkdir)

function cleanup() {
    return new Promise(resolve => {
        rimraf('test/__output/**', () => resolve())
    })
}

function fileNotPresent(t, path) {
    return new Promise(resolve => {
        fs.stat(path, (err, stats) => {
            if (!err) t.fail('File should not be present: ' + path)
            resolve()
        })
    })
}

function compareFileWithGzip(t, path, extension) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, bundleContent) => {
            if (err) {
                t.fail('Bundle not found!')
                reject()
                return
            }

            fs.readFile(path + (extension || '.gz'), (err, gzipContent) => {
                if (err) {
                    t.fail('Gzip file not found!')
                    reject()
                    return
                }

                zlib.gunzip(gzipContent, (err, unzippedContent) => {
                    t.deepEqual(
                        unzippedContent.toString(),
                        bundleContent.toString(),
                    )
                    resolve()
                })
            })
        })
    })
}

function writeFiles(files) {
    return createDirPromise('test/__output').then(() =>
        Promise.all(files.map(file => writeFilePromise(file[0], file[1]))),
    )
}

function delay(ms) {
    return new Promise((resolve, reject) =>
        setTimeout(() => resolve(), ms || 2500),
    )
}

test.beforeEach(() => cleanup())
test.afterEach(() => cleanup())

const sampleRollup = options =>
    rollup
        .rollup({
            input: 'test/sample/index.js',
            plugins: [gzip(options)],
        })
        .then(bundle => {
            return bundle.write({
                file: 'test/__output/bundle.js',
                format: 'iife',
                sourcemap: true,
            })
        })

const sampleSplittingRollup = options =>
    rollup
        .rollup({
            input: ['test/sample-splitting/a.js', 'test/sample-splitting/b.js'],
            experimentalCodeSplitting: true,
            plugins: [gzip(options)],
        })
        .then(bundle => {
            return bundle.write({
                dir: 'test/__output',
                format: 'cjs',
            })
        })

test.serial('without options', t => {
    return sampleRollup().then(() =>
        compareFileWithGzip(t, 'test/__output/bundle.js'),
    )
})

test.serial('with fileName string option', t => {
    return sampleRollup({
        fileName: '.gzzz',
        algorithm: 'zopfli',
    }).then(() => compareFileWithGzip(t, 'test/__output/bundle.js', '.gzzz'))
})

test.serial('with fileName function option', t => {
    return sampleRollup({
        fileName: name => name + '.gzzz',
    }).then(() => compareFileWithGzip(t, 'test/__output/bundle.js', '.gzzz'))
})

test.serial('with customCompression option', t => {
    return sampleRollup({
        customCompression: content => content.toString() + 'XXX',
    }).then(
        () =>
            new Promise((resolve, reject) => {
                fs.readFile('test/__output/bundle.js', (err, bundleContent) => {
                    if (err) {
                        t.fail('Bundle not found!')
                        reject()
                        return
                    }

                    fs.readFile(
                        'test/__output/bundle.js.gz',
                        (err, compressedContent) => {
                            if (err) {
                                t.fail('Gzip file not found!')
                                reject()
                                return
                            }

                            t.deepEqual(
                                compressedContent.toString(),
                                bundleContent.toString() + 'XXX',
                            )
                            resolve()
                        },
                    )
                })
            }),
    )
})

test.serial('with additionalFiles option', t => {
    return writeFiles([
        ['test/__output/test1.txt', 'This is a test'],
        ['test/__output/test2.txt', 'This too'],
    ])
        .then(() =>
            sampleRollup({
                gzipOptions: {
                    level: 9,
                },
                additionalFiles: [
                    'test/__output/test1.txt',
                    'test/__output/test2.txt',
                ],
                additionalFilesDelay: 2000,
            }),
        )
        .then(() => compareFileWithGzip(t, 'test/__output/bundle.js'))
        .then(() => delay())
        .then(() => compareFileWithGzip(t, 'test/__output/test1.txt'))
        .then(() => compareFileWithGzip(t, 'test/__output/test2.txt'))
})

test.serial('splitting with regex filter option', t => {
    return sampleSplittingRollup({
        filter: /(b|c).js$/,
    })
        .then(() => fileNotPresent(t, 'test/__output/a.js.gz'))
        .then(() => compareFileWithGzip(t, 'test/__output/b.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/c.js'))
})

test.serial('splitting with function filter option', t => {
    return sampleSplittingRollup({
        filter: fileName => fileName[0] !== 'a',
    })
        .then(() => fileNotPresent(t, 'test/__output/a.js.gz'))
        .then(() => compareFileWithGzip(t, 'test/__output/b.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/c.js'))
})

test.serial('splitting with minSize option', t => {
    return sampleSplittingRollup({
        minSize: 80,
    })
        .then(() => fileNotPresent(t, 'test/__output/c.js.gz'))
        .then(() => compareFileWithGzip(t, 'test/__output/a.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/b.js'))
})
