import * as fs from 'fs'

import { cleanup, compareFileWithGzip, sampleRollup, sampleVite } from './utils'

describe('index', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  describe.each([
    ['rollup', sampleRollup],
    ['vite', sampleVite],
  ])('when using %s', (_, sampleFn) => {
    it('without options', () => {
      return sampleFn().then(expectedFileName =>
        compareFileWithGzip('test/__output/' + expectedFileName),
      )
    })

    it('with fileName string option', () => {
      return sampleFn({
        fileName: '.gzzz',
      }).then(expectedFileName =>
        compareFileWithGzip('test/__output/' + expectedFileName, '.gzzz'),
      )
    })

    it('with fileName function option', () => {
      return sampleFn({
        fileName: name => name + '.gzzz',
      }).then(expectedFileName =>
        compareFileWithGzip('test/__output/' + expectedFileName, '.gzzz'),
      )
    })

    it('with customCompression option', () => {
      return sampleFn({
        customCompression: content => content.toString() + 'XXX',
      }).then(
        expectedFileName =>
          new Promise<void>((resolve, reject) => {
            fs.readFile(
              'test/__output/' + expectedFileName,
              (err, bundleContent) => {
                if (err) {
                  reject('Bundle not found!')
                  return
                }

                fs.readFile(
                  'test/__output/' + expectedFileName + '.gz',
                  (err2, compressedContent) => {
                    if (err2) {
                      reject('Gzip file not found!')
                      return
                    }

                    expect(compressedContent.toString()).toEqual(
                      bundleContent.toString() + 'XXX',
                    )
                    resolve()
                  },
                )
              },
            )
          }),
      )
    })
  })
})
