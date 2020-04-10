import * as rollup from 'rollup'

import {
    cleanup,
    compareFileWithGzip,
    delay,
    writeFiles,
    sampleRollup,
} from './utils'

describe('additionalFiles', () => {
    beforeEach(() => cleanup())
    afterEach(() => cleanup())

    describe('files present before', () => {
        beforeEach(() =>
            writeFiles([
                ['test/__output/test1.txt', 'This is a test'],
                ['test/__output/test2.txt', 'This too'],
            ]),
        )

        it('with delay', () => {
            return sampleRollup({
                additionalFiles: [
                    'test/__output/test1.txt',
                    'test/__output/test2.txt',
                ],
                additionalFilesDelay: 2500,
            })
                .then(() => compareFileWithGzip('test/__output/bundle.js'))
                .then(() => delay(3500))
                .then(() => compareFileWithGzip('test/__output/test1.txt'))
                .then(() => compareFileWithGzip('test/__output/test2.txt'))
        })

        it('without delay', () => {
            return sampleRollup({
                additionalFiles: [
                    'test/__output/test1.txt',
                    'test/__output/test2.txt',
                ],
                additionalFilesDelay: 0,
            })
                .then(() => compareFileWithGzip('test/__output/bundle.js'))
                .then(() => compareFileWithGzip('test/__output/test1.txt'))
                .then(() => compareFileWithGzip('test/__output/test2.txt'))
        })
    })

    describe('files written by another plugin', () => {
        const additionalPlugin: rollup.Plugin = {
            name: 'additionalPlugin',
            generateBundle(outputOptions, bundle, isWrite) {
                if (!isWrite) return
                return writeFiles([
                    ['test/__output/test1.txt', 'This is a test'],
                    ['test/__output/test2.txt', 'This too'],
                ]) as Promise<any>
            },
        }

        it('with delay', () => {
            return sampleRollup(
                {
                    additionalFiles: [
                        'test/__output/test1.txt',
                        'test/__output/test2.txt',
                    ],
                    additionalFilesDelay: 2500,
                },
                [additionalPlugin],
            )
                .then(() => compareFileWithGzip('test/__output/bundle.js'))
                .then(() => delay(3500))
                .then(() => compareFileWithGzip('test/__output/test1.txt'))
                .then(() => compareFileWithGzip('test/__output/test2.txt'))
        })

        it('without delay', () => {
            return sampleRollup(
                {
                    additionalFiles: [
                        'test/__output/test1.txt',
                        'test/__output/test2.txt',
                    ],
                    additionalFilesDelay: 0,
                },
                [additionalPlugin],
            )
                .then(() => compareFileWithGzip('test/__output/bundle.js'))
                .then(() => compareFileWithGzip('test/__output/test1.txt'))
                .then(() => compareFileWithGzip('test/__output/test2.txt'))
        })
    })

    describe('files written by another plugin outside of rollup lifecycle', () => {
        const additionalPlugin: rollup.Plugin = {
            name: 'additionalPlugin',
            generateBundle(outputOptions, bundle, isWrite) {
                if (!isWrite) return
                setTimeout(
                    () =>
                        writeFiles([
                            ['test/__output/test1.txt', 'This is a test'],
                            ['test/__output/test2.txt', 'This too'],
                        ]),
                    1000,
                )
            },
        }

        it('with delay', () => {
            return sampleRollup(
                {
                    additionalFiles: [
                        'test/__output/test1.txt',
                        'test/__output/test2.txt',
                    ],
                    additionalFilesDelay: 2000,
                },
                [additionalPlugin],
            )
                .then(() => compareFileWithGzip('test/__output/bundle.js'))
                .then(() => delay(3000))
                .then(() => compareFileWithGzip('test/__output/test1.txt'))
                .then(() => compareFileWithGzip('test/__output/test2.txt'))
        })
    })
})
