import { join } from 'path'

import * as vite from 'vite'

import gzip, { GzipPluginOptions } from '../src/index'

import { cleanup, expectCompressedChunks } from './utils'

async function sampleSplittingVite(options: GzipPluginOptions) {
  const result = await vite.build({
    root: join(__dirname, './sample-splitting'),
    plugins: [gzip(options) as any],
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

  it('basic splitting', async () => {
    const chunks = await sampleSplittingVite({})
    await expectCompressedChunks(chunks, ['index', 'c'])
  })

  it('splitting with regex filter option', async () => {
    const chunks = await sampleSplittingVite({
      filter: /index/,
    })
    await expectCompressedChunks(chunks, ['index'])
  })

  it('splitting with function filter option', async () => {
    const chunks = await sampleSplittingVite({
      filter: fileName => fileName.includes('index'),
    })
    await expectCompressedChunks(chunks, ['index'])
  })

  it('splitting with minSize option', async () => {
    const chunks = await sampleSplittingVite({
      minSize: 100,
    })
    await expectCompressedChunks(chunks, ['index'])
  })
})
