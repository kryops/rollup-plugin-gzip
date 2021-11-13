import * as rollup from 'rollup'

import gzip from '../dist/index'
import { GzipPluginOptions } from '../src/index'

import { cleanup, expectCompressedChunks } from './utils'

async function sampleSplittingRollup(options: GzipPluginOptions) {
  const inputOptions = {
    input: ['test/sample-splitting/a.js', 'test/sample-splitting/b.js'],
    plugins: [gzip(options)],
  }

  const result = await rollup.rollup(inputOptions).then(bundle => {
    return bundle.write({
      dir: 'test/__output',
      format: 'cjs',
      sourcemap: true,
    })
  })

  return result.output
    .filter(chunk => chunk.fileName.endsWith('.js'))
    .map(chunk => chunk.fileName)
}

describe('code splitting', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it('basic splitting', async () => {
    const chunks = await sampleSplittingRollup({})
    await expectCompressedChunks(chunks, ['a', 'b', 'c'])
  })

  it('splitting with regex filter option', async () => {
    const chunks = await sampleSplittingRollup({ filter: /(b|c-.+).js$/ })
    await expectCompressedChunks(chunks, ['b', 'c'])
  })

  it('splitting with function filter option', async () => {
    const chunks = await sampleSplittingRollup({
      filter: fileName => fileName[0] !== 'a',
    })
    await expectCompressedChunks(chunks, ['b', 'c'])
  })

  it('splitting with minSize option', async () => {
    const chunks = await sampleSplittingRollup({
      minSize: 120,
    })
    await expectCompressedChunks(chunks, ['a', 'b'])
  })
})
