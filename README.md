# rollup-plugin-gzip

Creates a compressed `.gz` artifact for your Rollup bundle.

## Installation

```
npm install --save-dev rollup-plugin-gzip
```

## Usage

```js
import { rollup } from 'rollup'
import gzip from 'rollup-plugin-gzip'

rollup({
    input: 'src/index.js',
    plugins: [gzip()],
}).then(/* ... */)
```

### Configuration

**filter** `RegExp | (fileName: string) => boolean`

Control which of the output files to compress

Defaults to `/\.(js|json|css)$/`

**gzipOptions** `object`

GZIP compression options, see https://nodejs.org/api/zlib.html#zlib_class_options

**minSize** `number`

Specified the minimum size in Bytes for a file to get compressed. Files that are smaller than this threshold will not be compressed. This does not apply to the files specified through `additionalFiles`!

**additionalFiles** `string[]`

This option allows you to compress additional files outside of the main rollup bundling process. The processing is delayed to make sure the files are written on disk; the delay is controlled through `additionalFilesDelay`.

**additionalFilesDelay** `number`

This options sets a delay (ms) before the plugin compresses the files specified through `additionalFiles`. Increase this value if your artifacts take a long time to generate.

Defaults to `2000`

**customCompression** `(content: string | Buffer) => string | Buffer | Promise<string | Buffer>`

Set a custom compression algorithm. The function can either return the compressed contents synchronously, or otherwise return a promise for asynchronous processing.

**fileName** `string | (fileName: string) => string`

Set a custom file name convention for the compressed files. Can be a suffix string or a function returning the file name.

Defaults to `.gz`

## Examples

### Brotli Compression

```ts
import { compress } from 'brotli'
import { rollup } from 'rollup'
import gzip from 'rollup-plugin-gzip'

rollup({
    input: 'src/index.js',
    plugins: [
        gzip({
            customCompression: content => compress(content),
            fileName: '.br',
        }),
    ],
}).then(/* ... */)
```

## License

MIT
