import { join } from 'path'

import * as vite from 'vite'

import gzip from '../dist/index'
import { GzipPluginOptions } from '../src/index'

import { cleanup } from './utils'

async function sampleSplittingVite(options: GzipPluginOptions) {
    const result = await vite.build({
        root: join(__dirname, './sample-splitting'),
        plugins: [gzip(options)],
        build: {
            outDir: join(__dirname, './__output'),
            sourcemap: true,
        },
        logLevel: 'error',
    })

    if ('output' in result) {
        return result.output
            .filter(chunk => chunk.fileName.endsWith('.js'))
            .map(chunk => chunk.fileName)
    }
    throw new Error('Could not find output assets')
}

describe('code splitting', () => {
    beforeEach(() => cleanup())
    afterEach(() => cleanup())

    it('throws an error when detecting an incompatible Vite bundle', async () => {
        await expect(sampleSplittingVite({})).rejects.toThrow()
    })
})
