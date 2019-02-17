import * as fs from 'fs'
import * as rollup from 'rollup'

import gzip from '../dist/index'
import { GzipPluginOptions } from '../src/index'

import {
    cleanup,
    compareFileWithGzip,
    delay,
    fileNotPresent,
    writeFiles,
} from './utils'

describe('index', () => {
    beforeEach(() => cleanup())
    afterEach(() => cleanup())

    const sampleRollup = (options?: GzipPluginOptions) =>
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

    const sampleSplittingRollup = (options: GzipPluginOptions) => {
        const inputOptions = {
            input: ['test/sample-splitting/a.js', 'test/sample-splitting/b.js'],
            plugins: [gzip(options)],
        }

        if (rollup.VERSION < '1.0.0') {
            ;(inputOptions as any).experimentalCodeSplitting = true
        }

        return rollup.rollup(inputOptions).then(bundle => {
            return bundle.write({
                dir: 'test/__output',
                format: 'cjs',
            })
        })
    }

    it('without options', () => {
        return sampleRollup().then(() =>
            compareFileWithGzip('test/__output/bundle.js'),
        )
    })

    it('with fileName string option', () => {
        return sampleRollup({
            fileName: '.gzzz',
        }).then(() => compareFileWithGzip('test/__output/bundle.js', '.gzzz'))
    })

    it('with fileName function option', () => {
        return sampleRollup({
            fileName: name => name + '.gzzz',
        }).then(() => compareFileWithGzip('test/__output/bundle.js', '.gzzz'))
    })

    it('with customCompression option', () => {
        return sampleRollup({
            customCompression: content => content.toString() + 'XXX',
        }).then(
            () =>
                new Promise((resolve, reject) => {
                    fs.readFile(
                        'test/__output/bundle.js',
                        (err, bundleContent) => {
                            if (err) {
                                reject('Bundle not found!')
                                return
                            }

                            fs.readFile(
                                'test/__output/bundle.js.gz',
                                (err2, compressedContent) => {
                                    if (err2) {
                                        reject('Gzip file not found!')
                                        return
                                    }

                                    expect(
                                        compressedContent.toString(),
                                    ).toEqual(bundleContent.toString() + 'XXX')
                                    resolve()
                                },
                            )
                        },
                    )
                }),
        )
    })

    it('with additionalFiles option', () => {
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
                    additionalFilesDelay: 2500,
                }),
            )
            .then(() => compareFileWithGzip('test/__output/bundle.js'))
            .then(() => delay(3500))
            .then(() => compareFileWithGzip('test/__output/test1.txt'))
            .then(() => compareFileWithGzip('test/__output/test2.txt'))
    })

    it('splitting with regex filter option', () => {
        return (
            sampleSplittingRollup({
                filter: /(b|chunk-.+).js$/,
            })
                .then(() => fileNotPresent('test/__output/a.js.gz'))
                .then(() => compareFileWithGzip('test/__output/b.js'))
                // TODO this does not seem to be stable across rollup versions
                .then(() =>
                    compareFileWithGzip('test/__output/chunk-ec6316da.js'),
                )
        )
    })

    it('splitting with function filter option', () => {
        return (
            sampleSplittingRollup({
                filter: fileName => fileName[0] !== 'a',
            })
                .then(() => fileNotPresent('test/__output/a.js.gz'))
                .then(() => compareFileWithGzip('test/__output/b.js'))
                // TODO this does not seem to be stable across rollup versions
                .then(() =>
                    compareFileWithGzip('test/__output/chunk-ec6316da.js'),
                )
        )
    })

    it('splitting with minSize option', () => {
        return sampleSplittingRollup({
            minSize: 80,
        })
            .then(() => fileNotPresent('test/__output/c.js.gz'))
            .then(() => compareFileWithGzip('test/__output/a.js'))
            .then(() => compareFileWithGzip('test/__output/b.js'))
    })
})
