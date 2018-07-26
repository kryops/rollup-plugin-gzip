import * as fs from 'fs'
import * as zlib from 'zlib'
import test from 'ava'
import rimraf from 'rimraf'
import * as rollup from 'rollup'
import gzip from '../dist/index'

function cleanup() {
    return new Promise(resolve => {
        rimraf('test/__output', () => resolve())
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

function compareFileWithGzip(t, path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, bundleContent) => {
            if (err) {
                t.fail('Bundle not found!')
                reject()
                return
            }

            fs.readFile(path + '.gz', (err, gzipContent) => {
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

test.beforeEach(() => cleanup())
//test.afterEach(() => cleanup())

test.serial('without options', t => {
    return rollup
        .rollup({
            input: 'test/sample/index.js',
            plugins: [gzip()],
        })
        .then(bundle => {
            return bundle.write({
                file: 'test/__output/bundle.js',
                format: 'iife',
                sourcemap: true,
            })
        })
        .then(() => compareFileWithGzip(t, 'test/__output/bundle.js'))
})

test.skip.serial('with options', t => {
    return rollup
        .rollup({
            input: 'test/sample/index.js',
            plugins: [
                // file that is above the size option => gets compressed
                {
                    name: 'test',
                    onwrite: (options, bundle) => {
                        return new Promise(resolve => {
                            fs.writeFile(
                                'test/__output/test1.txt',
                                'This is a test',
                                () => resolve(),
                            )
                        })
                    },
                },
                // short file that is below the size option => not compressed
                {
                    name: 'test2',
                    onwrite: (options, bundle) => {
                        return new Promise(resolve => {
                            fs.writeFile(
                                'test/__output/test2.txt',
                                'Short',
                                () => resolve(),
                            )
                        })
                    },
                },
                gzip({
                    options: {
                        level: 9,
                    },
                    additional: [
                        'test/__output/test1.txt',
                        'test/__output/test2.txt',
                    ],
                    minSize: 10,
                }),
            ],
        })
        .then(bundle => {
            return bundle.write({
                file: 'test/__output/bundle.js',
                format: 'cjs',
            })
        })
        .then(() => compareFileWithGzip(t, 'test/__output/bundle.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/test1.txt'))
        .then(() => fileNotPresent(t, 'test/__output/test2.txt.gz'))
})

test.skip.serial('delayed writing in plugin', t => {
    return rollup
        .rollup({
            input: 'test/sample/index.js',
            plugins: [
                {
                    name: 'test',
                    onwrite: (options, bundle) => {
                        return new Promise(resolve => {
                            setTimeout(() => {
                                fs.writeFile(
                                    'test/__output/test3.txt',
                                    'This is a test',
                                    () => resolve(),
                                )
                            }, 1000)
                        })
                    },
                },
                gzip({
                    additional: ['test/__output/test3.txt'],
                }),
            ],
        })
        .then(bundle => {
            return bundle.write({
                file: 'test/__output/bundle.js',
                format: 'cjs',
            })
        })
        .then(() => compareFileWithGzip(t, 'test/__output/bundle.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/test3.txt'))
})

test.skip.serial('delayed writing in plugin without promise', t => {
    return rollup
        .rollup({
            input: 'test/sample/index.js',
            plugins: [
                {
                    name: 'test',
                    onwrite: (options, bundle) => {
                        setTimeout(() => {
                            fs.writeFile(
                                'test/__output/test3.txt',
                                'This is a test',
                                () => {},
                            )
                        }, 1000)
                    },
                },
                gzip({
                    additional: ['test/__output/test3.txt'],
                    delay: 2000,
                }),
            ],
        })
        .then(bundle => {
            return bundle.write({
                file: 'test/__output/bundle.js',
                format: 'cjs',
            })
        })
        .then(() => compareFileWithGzip(t, 'test/__output/bundle.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/test3.txt'))
})

test.skip.serial('splitting', t => {
    return rollup
        .rollup({
            input: ['test/sample-splitting/a.js', 'test/sample-splitting/b.js'],
            experimentalCodeSplitting: true,
            plugins: [gzip()],
        })
        .then(bundle => {
            return bundle.write({
                dir: 'test/__output',
                format: 'cjs',
            })
        })
        .then(() => new Promise(resolve => setTimeout(() => resolve(), 1500)))
        .then(() => compareFileWithGzip(t, 'test/__output/a.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/b.js'))
        .then(() => compareFileWithGzip(t, 'test/__output/c.js'))
})
