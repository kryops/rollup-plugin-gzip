import * as fs from 'fs/promises'

import {
  cleanup,
  expectFileHasBeenCompressed,
  sampleRollup,
  sampleVite,
} from './utils'

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
      const bundle = await fs.readFile(
        'test/__output/' + expectedFileName,
        'utf8',
      )
      const compressed = await fs.readFile(
        'test/__output/' + expectedFileName + '.gz',
        'utf8',
      )
      expect(compressed).toBe(bundle + 'XXX')
    })
  })
})
