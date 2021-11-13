import * as rollup from 'rollup'

import {
  cleanup,
  expectFileHasBeenCompressed,
  delay,
  writeFiles,
  sampleRollup,
  sampleVite,
} from './utils'

describe('additionalFiles', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  describe.each([
    ['rollup', sampleRollup],
    ['vite', sampleVite],
  ])('when using %s', (_, sampleFn) => {
    describe('files present before', () => {
      beforeEach(() =>
        writeFiles([
          ['test/__output/test1.txt', 'This is a test'],
          ['test/__output/test2.txt', 'This too'],
        ]),
      )

      it('with delay', async () => {
        const expectedFileName = await sampleFn({
          additionalFiles: [
            'test/__output/test1.txt',
            'test/__output/test2.txt',
          ],
          additionalFilesDelay: 500,
        })
        await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
        await delay(1000)
        await expectFileHasBeenCompressed('test/__output/test1.txt')
        await expectFileHasBeenCompressed('test/__output/test2.txt')
      })

      it('without delay', async () => {
        const expectedFileName = await sampleFn({
          additionalFiles: [
            'test/__output/test1.txt',
            'test/__output/test2.txt',
          ],
          additionalFilesDelay: 0,
        })
        await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
        await expectFileHasBeenCompressed('test/__output/test1.txt')
        await expectFileHasBeenCompressed('test/__output/test2.txt')
      })
    })

    describe('files written by another plugin', () => {
      const additionalPlugin: rollup.Plugin = {
        name: 'additionalPlugin',
        generateBundle(outputOptions, bundle, isWrite) {
          if (!isWrite) return
          return writeFiles([
            ['test/__output/test1.txt', 'This is a test'],
            ['test/__output/test2.txt', 'This too'],
          ]) as Promise<any>
        },
      }

      it('with delay', async () => {
        const expectedFileName = await sampleFn(
          {
            additionalFiles: [
              'test/__output/test1.txt',
              'test/__output/test2.txt',
            ],
            additionalFilesDelay: 500,
          },
          [additionalPlugin],
        )
        await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
        await delay(1000)
        await expectFileHasBeenCompressed('test/__output/test1.txt')
        await expectFileHasBeenCompressed('test/__output/test2.txt')
      })

      it('without delay', async () => {
        const expectedFileName = await sampleFn(
          {
            additionalFiles: [
              'test/__output/test1.txt',
              'test/__output/test2.txt',
            ],
            additionalFilesDelay: 0,
          },
          [additionalPlugin],
        )
        await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
        await expectFileHasBeenCompressed('test/__output/test1.txt')
        await expectFileHasBeenCompressed('test/__output/test2.txt')
      })
    })

    describe('files written by another plugin outside of rollup lifecycle', () => {
      const additionalPlugin: rollup.Plugin = {
        name: 'additionalPlugin',
        generateBundle(outputOptions, bundle, isWrite) {
          if (!isWrite) return
          setTimeout(
            () =>
              writeFiles([
                ['test/__output/test1.txt', 'This is a test'],
                ['test/__output/test2.txt', 'This too'],
              ]),
            500,
          )
        },
      }

      it('with delay', async () => {
        const expectedFileName = await sampleFn(
          {
            additionalFiles: [
              'test/__output/test1.txt',
              'test/__output/test2.txt',
            ],
            additionalFilesDelay: 1000,
          },
          [additionalPlugin],
        )
        await expectFileHasBeenCompressed('test/__output/' + expectedFileName)
        await delay(1500)
        await expectFileHasBeenCompressed('test/__output/test1.txt')
        await expectFileHasBeenCompressed('test/__output/test2.txt')
      })
    })
  })
})
