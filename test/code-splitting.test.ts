import * as rollup from 'rollup'

import gzip from '../dist/index'
import { GzipPluginOptions } from '../src/index'

import { cleanup, compareFileWithGzip, fileNotPresent } from './utils'

const sampleSplittingRollup = async (options: GzipPluginOptions) => {
    const inputOptions = {
        input: ['test/sample-splitting/a.js', 'test/sample-splitting/b.js'],
        plugins: [gzip(options)],
    }

    if (rollup.VERSION < '1.0.0') {
        ;(inputOptions as any).experimentalCodeSplitting = true
    }

    const result = await rollup.rollup(inputOptions).then(bundle => {
        return bundle.write({
            dir: 'test/__output',
            format: 'cjs',
        })
    })

    return result
}

describe('code splitting', () => {
    beforeEach(() => cleanup())
    afterEach(() => cleanup())

    it('splitting with regex filter option', () => {
        return (
            sampleSplittingRollup({
                filter: /(b|c-.+).js$/,
            })
                .then(() => fileNotPresent('test/__output/a.js.gz'))
                .then(() => compareFileWithGzip('test/__output/b.js'))
                // TODO this does not seem to be stable across rollup versions
                .then(() => compareFileWithGzip('test/__output/c-6a11db38.js'))
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
                .then(() => compareFileWithGzip('test/__output/c-6a11db38.js'))
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
