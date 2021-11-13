import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import { join } from 'path'
import { dirname } from 'path'
import * as zlib from 'zlib'
import { promisify } from 'util'

import * as rimraf from 'rimraf'
import * as rollup from 'rollup'
import * as vite from 'vite'

import gzip from '../dist/index'
import { GzipPluginOptions } from '../src/index'

const gunzipPromise = promisify(zlib.gunzip)

export async function cleanup() {
  await new Promise<void>(resolve => {
    rimraf('test/__output/**', () => resolve())
  })
  await mkdir('test/__output', { recursive: true })
}

export async function sampleRollup(
  options?: GzipPluginOptions,
  plugins: rollup.Plugin[] = [],
) {
  const bundle = await rollup.rollup({
    input: 'test/sample/index.js',
    plugins: [...plugins, gzip(options)],
  })

  await bundle.write({
    file: 'test/__output/bundle.js',
    format: 'iife',
    sourcemap: true,
  })

  return 'bundle.js'
}

export async function sampleVite(
  options?: GzipPluginOptions,
  plugins: rollup.Plugin[] = [],
) {
  const result = await vite.build({
    root: join(__dirname, './sample'),
    plugins: [...plugins, gzip(options)],
    build: {
      outDir: join(__dirname, './__output'),
      sourcemap: true,
    },
    logLevel: 'error',
  })

  if ('output' in result) {
    const asset = result.output.find(chunk => chunk.fileName.endsWith('.js'))
    return asset?.fileName
  }

  throw new Error('Could not find output asset')
}

export async function expectFileNotPresent(path: string) {
  try {
    await stat(path)
  } catch {
    return
  }
  throw new Error('File should not be present: ' + path)
}

export async function expectFileHasBeenCompressed(
  path: string,
  extension?: string,
) {
  let bundleContent: Buffer
  try {
    bundleContent = await readFile(path)
  } catch {
    const filesPresent = await readdir(dirname(path))
    throw new Error(
      `Bundle not found! ${path} - files present: ${filesPresent.join(', ')}`,
    )
  }

  let gzipContent: Buffer
  try {
    gzipContent = await readFile(path + (extension || '.gz'))
  } catch {
    throw new Error('Gzip file not found! ' + path)
  }

  const unzippedContent = await gunzipPromise(gzipContent)

  expect(unzippedContent.toString()).toEqual(bundleContent.toString())
}

export async function writeFiles(files: Array<[string, string]>) {
  await mkdir('test/__output', { recursive: true })
  await Promise.all(files.map(file => writeFile(file[0], file[1])))
}

export function delay(ms = 2500) {
  return new Promise<void>((resolve, reject) => setTimeout(() => resolve(), ms))
}

export function getChunk(chunks: string[], name: string): string {
  const chunk = chunks.find(
    it => it.startsWith(name) || it.includes('/' + name),
  )

  if (!chunk) throw new Error('Chunk ' + chunk + ' not found!')

  return chunk
}

export async function expectCompressedChunks(
  allChunks: string[],
  compressedNames: string[],
) {
  const compressedChunks = compressedNames.map(name =>
    getChunk(allChunks, name),
  )

  await Promise.all(
    allChunks.map(chunk => {
      if (compressedChunks.includes(chunk)) {
        return expectFileHasBeenCompressed('test/__output/' + chunk)
      } else {
        return expectFileNotPresent('test/__output/' + chunk + '.gz')
      }
    }),
  )
}
