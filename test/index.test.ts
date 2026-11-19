import * as fs from 'fs'

import {
  cleanup,
  expectFileHasBeenCompressed,
  sampleRolldown,
  sampleRolldownVite,
  sampleRollup,
  sampleVite,
} from './utils.js'

// Unit tests do not run on Node 10 anyway
// eslint-disable-next-line n/no-unsupported-features/node-builtins
const readFile = fs.promises.readFile

describe('index', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  describe.each([
    ['rollup', sampleRollup],
    ['vite', sampleVite],
    ['rolldown', sampleRolldown],
    ['rolldown-vite', sampleRolldownVite],
  ])('when using %s', (_, sampleFn) => {
    it('without options', async () => {
      const expectedFileName = await sampleFn()
      await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
    })

    it('with fileName string option', async () => {
      const expectedFileName = await sampleFn({ fileName: '.gzzz' })
      await expectFileHasBeenCompressed(
        'test/__output/' + expectedFileName,
        '.gzzz',
      )
    })

    it('with fileName function option', async () => {
      const expectedFileName = await sampleFn({
        fileName: name => name + '.gzzz',
      })
      await expectFileHasBeenCompressed(
        'test/__output/' + expectedFileName,
        '.gzzz',
      )
    })

    it('with customCompression option', async () => {
      const expectedFileName = await sampleFn({
        customCompression: content => content.toString() + 'XXX',
      })
      const bundle = await readFile('test/__output/' + expectedFileName, 'utf8')
      const compressed = await readFile(
        'test/__output/' + expectedFileName + '.gz',
        'utf8',
      )
      expect(compressed).toBe(bundle + 'XXX')
    })

    it('with explicitly undefined options', async () => {
      const expectedFileName = await sampleFn({
        filter: undefined,
        gzipOptions: undefined,
        minSize: undefined,
        additionalFiles: undefined,
        additionalFilesDelay: undefined,
        customCompression: undefined,
        fileName: undefined,
        verifyContent: undefined,
      })
      await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
      // default filter must still apply, so source maps are not compressed
      expect(fs.existsSync(`test/__output/${expectedFileName}.map.gz`)).toBe(
        false,
      )
    })

    it.each([undefined, true, false, 'inline', 'hidden'] as const)(
      'with sourcemap: %p',
      async sourcemap => {
        const expectedFileName = await sampleFn({}, [], sourcemap)
        await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
      },
    )
  })

  describe('minSize', () => {
    // 4 characters, but 8 bytes in UTF-8
    const emitAssetPlugin = {
      name: 'emit-asset',
      generateBundle(this: any) {
        this.emitFile({
          type: 'asset',
          fileName: 'umlauts.json',
          source: '"ää"',
        })
      },
    }

    it('compresses files whose byte size reaches minSize', async () => {
      await sampleRollup({ minSize: 6 }, [emitAssetPlugin])
      expect(fs.existsSync('test/__output/umlauts.json.gz')).toBe(true)
    })

    it('skips files whose byte size is below minSize', async () => {
      await sampleRollup({ minSize: 9 }, [emitAssetPlugin])
      expect(fs.existsSync('test/__output/umlauts.json')).toBe(true)
      expect(fs.existsSync('test/__output/umlauts.json.gz')).toBe(false)
    })
  })
})
