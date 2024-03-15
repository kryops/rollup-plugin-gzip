import * as fs from 'fs'

import {
  cleanup,
  expectFileHasBeenCompressed,
  sampleRollup,
  sampleVite,
} from './utils'

// Unit tests do not run on Node 10 anyway
// eslint-disable-next-line node/no-unsupported-features/node-builtins
const readFile = fs.promises.readFile

describe('index', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  describe.each([
    ['rollup', sampleRollup],
    ['vite', sampleVite],
  ])('when using %s', (_, sampleFn) => {
    it('without options', async () => {
      const expectedFileName = await sampleFn()
      await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
    })

    it('with fileName string option', async () => {
      const expectedFileName = await sampleFn({
        fileName: '.gzzz',
      })
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

    it.each([undefined, true, false, 'inline', 'hidden'] as const)(
      'with sourcemap: %p',
      async sourcemap => {
        const expectedFileName = await sampleFn({}, [], sourcemap)
        await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
      },
    )
  })
})
