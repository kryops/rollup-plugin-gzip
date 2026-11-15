import * as fs from 'fs'
import { join } from 'path'

import * as rollup from 'rollup'
import * as rolldown from 'rolldown'
import * as vite from 'vite'
import * as rolldownVite from 'rolldown-vite'

import gzip from '../src/index.js'

import { cleanup } from './utils.js'

// eslint-disable-next-line n/no-unsupported-features/node-builtins
const { readdir } = fs.promises

type Bundler = 'rollup' | 'rolldown' | 'vite' | 'rolldown-vite'

const bundlers: Bundler[] = ['rollup', 'rolldown', 'vite', 'rolldown-vite']

/** Simulates another plugin altering the written files after the bundler generated them */
const tamperPlugin = () => ({
  name: 'tamper',
  writeBundle: {
    order: 'pre' as const,
    sequential: true,
    handler(outputOptions: { dir?: string; file?: string }, bundle: any) {
      const dir = outputOptions.dir ?? join(outputOptions.file!, '..')
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith('.js')) {
          fs.appendFileSync(join(dir, fileName), '// tampered\n')
        }
      }
    },
  },
})

async function build(
  bundler: Bundler,
  plugins: any[],
  sourcemap: boolean | 'inline',
) {
  if (bundler === 'rollup' || bundler === 'rolldown') {
    const options = { input: 'test/sample/index.js', plugins }
    const output = {
      file: 'test/__output/bundle.js',
      format: 'iife' as const,
      sourcemap,
    }
    const bundle =
      bundler === 'rollup'
        ? await rollup.rollup(options)
        : await rolldown.rolldown(options)
    await bundle.write(output)
  } else {
    const implementation = bundler === 'vite' ? vite : rolldownVite
    await implementation.build({
      root: join(__dirname, './sample-splitting'),
      plugins,
      build: { outDir: join(__dirname, './__output'), sourcemap },
      logLevel: 'error',
    })
  }
}

async function expectCompressedFilesPresent() {
  const files = await readdir('test/__output', { recursive: true })
  expect(files.some(file => file.endsWith('.js.gz'))).toBe(true)
}

describe.each(bundlers)('verifyContent (%s)', bundler => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it.each([true, 'inline'] as const)(
    'passes when content matches the file on disk (sourcemap: %s)',
    async sourcemap => {
      await build(bundler, [gzip({ verifyContent: true })], sourcemap)
      await expectCompressedFilesPresent()
    },
  )

  it('fails the build when content differs from the file on disk', async () => {
    await expect(
      build(bundler, [tamperPlugin(), gzip({ verifyContent: true })], true),
    ).rejects.toThrow(/Content verification failed/)
  })
})
