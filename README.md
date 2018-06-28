# rollup-plugin-gzip

Creates a compressed `.gz` artifact for your Rollup bundle.


## Installation

```
npm install --save-dev rollup-plugin-gzip
```


## Usage

```js
import {rollup} from "rollup";
import gzip from "rollup-plugin-gzip";

rollup({
    input: 'src/index.js',
    plugins: [
        gzip()
    ]
}).then(/* ... */)
```

### Configuration

Compression with Node's internal `zlib` compressor:

```js
gzip({
    options: {
        level: 9
        // ...
    },
    additional: [
        'dist/bundle.css'
    ],
    minSize: 1000,
    delay: 5000
})
```

Compression with `node-zopfli`:

```js
gzip({
    algorithm: 'zopfli',
    options: {
        numiterations: 10
        // ...
    }
    // ...
})
```

**algorithm**: `'zlib'` (default) or `'zopfli'`

If you set `algorithm: 'zopfli'`, you will have to install the `node-zopfli` module as well:

```
npm install --save-dev node-zopfli
```

**options**: 

* with `algorithm: 'zlib'` (default): [zlib options](https://nodejs.org/api/zlib.html#zlib_class_options)
* with `algorithm: 'zopfli'`: [node-zopfli options](https://www.npmjs.com/package/node-zopfli#options)

**additional**: Compress additional files

This option allows you to compress additional files that were created by other Rollup plugins.

As the `onwrite` callback for all plugins is executed in the same order they are listed in the `plugins` array, this might only work if the gzip plugin is positioned after all other plugins that create additional files.

**minSize**: Minimum size for compression (bytes)

Specified the minimum size in Bytes for a file to get compressed. Files that are smaller than this threshold will not be compressed. This applies to both the generated bundle and specified additional files.

**delay**: Delay starting the compression (ms)

In case if another plugin writes additional assets outside of the plugin lifecycle, you can delay starting the compression by a specified amount of time.

Due to a regression in rollup 0.60.0 which stops guaranteeing the execution order of plugin hooks, we assume a default delay of 5000ms for affected versions when additional assets are to be compressed. If your additional assets aren't being compressed, try increasing this number.

## License

MIT
