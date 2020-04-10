import * as fs from 'fs'

import { cleanup, compareFileWithGzip, sampleRollup } from './utils'

describe('index', () => {
    beforeEach(() => cleanup())
    afterEach(() => cleanup())

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
})
