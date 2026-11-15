import * as fs from 'fs'

import * as rollup from 'rollup'
import * as rolldown from 'rolldown'

import gzip from '../src/index.js'

import {
  cleanup,
  expectFileHasBeenCompressed,
  expectFileNotPresent,
} from './utils.js'

// eslint-disable-next-line n/no-unsupported-features/node-builtins
const readFile = fs.promises.readFile

// eslint-disable-next-line n/no-unsupported-features/node-builtins
const stat = fs.promises.stat

const expectFileExists = async (path: string) => {
  await stat(path)
}

const sourceMappingUrlRegExp = /^\/\/# sourceMappingURL=(.*)$/gm

async function build(
  bundler: 'rollup' | 'rolldown',
  outputOptions: Record<string, unknown>,
) {
  const options = {
    input: 'test/sample/index.js',
    plugins: [gzip()] as any,
  }
  const output = {
    file: 'test/__output/bundle.js',
    format: 'iife' as const,
    sourcemap: true,
    ...outputOptions,
  }

  if (bundler === 'rollup') {
    const bundle = await rollup.rollup(options)
    await bundle.write(output as any)
  } else {
    const bundle = await rolldown.rolldown(options)
    await bundle.write(output as any)
  }
}

describe('sourcemap options', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  describe.each(['rollup', 'rolldown'] as const)('when using %s', bundler => {
    it('with sourcemapBaseUrl', async () => {
      await build(bundler, { sourcemapBaseUrl: 'https://example.com/maps' })

      await expectFileHasBeenCompressed('test/__output/bundle.js')
      const content = await readFile('test/__output/bundle.js', 'utf8')
      const comments = [...content.matchAll(sourceMappingUrlRegExp)]
      expect(comments.map(it => it[1])).toEqual([
        'https://example.com/maps/bundle.js.map',
      ])
    })

    it('with sourcemapFileNames', async () => {
      await build(bundler, { sourcemapFileNames: 'custom-[name].map' })

      await expectFileHasBeenCompressed('test/__output/bundle.js')
      const content = await readFile('test/__output/bundle.js', 'utf8')
      const comments = [...content.matchAll(sourceMappingUrlRegExp)]
      expect(comments.map(it => it[1])).toEqual(['custom-index.map'])
      await expectFileExists('test/__output/custom-index.map')
      await expectFileNotPresent('test/__output/bundle.js.map')
    })
  })
})
