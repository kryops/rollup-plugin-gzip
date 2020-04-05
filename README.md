# rollup-plugin-gzip

Creates a compressed `.gz` artifact for your Rollup bundle.

**COMPATIBILITY NOTE**: Version 2.x is compatible with rollup 0.60 and above! For older versions of rollup, use version 1.x of this plugin.

## Installation

```
npm install --save-dev rollup-plugin-gzip
```

## Usage

```js
import { rollup } from 'rollup'
import gzipPlugin from 'rollup-plugin-gzip'

rollup({
    input: 'src/index.js',
    plugins: [gzipPlugin()],
}).then(/* ... */)
```

> **NOTE**: This plugin is an ES module. If you import it using `require()`, you have to point to the default export via `require('rollup-plugin-gzip').default`

### Configuration

**filter** `RegExp | (fileName: string) => boolean`

Control which of the output files to compress.

Defaults to `/\.(js|mjs|json|css)$/`

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

Defaults to `".gz"`

## Examples

### Brotli Compression

```ts
import { compress } from 'brotli'
import { rollup } from 'rollup'
import gzipPlugin from 'rollup-plugin-gzip'

rollup({
    input: 'src/index.js',
    plugins: [
        gzipPlugin({
            customCompression: content => compress(Buffer.from(content)),
            fileName: '.br',
        }),
    ],
}).then(/* ... */)
```

### Zopfli Compression

```ts
import { gzip } from 'node-zopfli'
import { rollup } from 'rollup'
import gzipPlugin from 'rollup-plugin-gzip'

rollup({
    input: 'src/index.js',
    plugins: [
        gzipPlugin({
            customCompression: content => gzip(Buffer.from(content)),
        }),
    ],
}).then(/* ... */)
```

### Compressing into multiple formats

To support compressing your bundle into multiple different formats, you can add this plugin multiple times with different configurations:

```ts
import { compress } from 'brotli'
import { rollup } from 'rollup'
import gzipPlugin from 'rollup-plugin-gzip'

rollup({
    input: 'src/index.js',
    plugins: [
        // GZIP compression as .gz files
        gzipPlugin(),
        // Brotil compression as .br files
        gzipPlugin({
            customCompression: content => compress(Buffer.from(content)),
            fileName: '.br',
        }),
    ],
}).then(/* ... */)
```

## License

MIT
