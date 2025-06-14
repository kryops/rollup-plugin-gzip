import { join } from 'path'

import * as vite from 'vite'
import * as rolldownVite from 'rolldown-vite'

import gzip, { GzipPluginOptions } from '../src/index.js'

import { cleanup, expectCompressedChunks } from './utils.js'

async function sampleSplittingVite(
  implementation: typeof vite | typeof rolldownVite,
  options: GzipPluginOptions,
) {
  const result = await implementation.build({
    root: join(__dirname, './sample-splitting'),
    plugins: [gzip(options) as any],
    build: { outDir: join(__dirname, './__output'), sourcemap: true },
    logLevel: 'error',
  })

  if ('output' in result) {
    return result.output
      .filter(chunk => chunk.fileName.endsWith('.js'))
      .map(chunk => chunk.fileName)
  }
  throw new Error('Could not find output assets')
}

describe.each([
  ['vite', vite],
  ['rolldown-vite', rolldownVite],
])('code splitting (%s)', (_, implementation) => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it('basic splitting', async () => {
    const chunks = await sampleSplittingVite(implementation, {})
    await expectCompressedChunks(chunks, ['index', 'c'])
  })

  it('splitting with regex filter option', async () => {
    const chunks = await sampleSplittingVite(implementation, {
      filter: /index/,
    })
    await expectCompressedChunks(chunks, ['index'])
  })

  it('splitting with function filter option', async () => {
    const chunks = await sampleSplittingVite(implementation, {
      filter: fileName => fileName.includes('index'),
    })
    await expectCompressedChunks(chunks, ['index'])
  })

  it('splitting with minSize option', async () => {
    const chunks = await sampleSplittingVite(implementation, { minSize: 100 })
    await expectCompressedChunks(chunks, ['index'])
  })
})
