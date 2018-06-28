import * as fs from 'fs';
import { VERSION } from 'rollup';

function gzipCompressFile(file, algorithm, options, minSize) {
    return new Promise(resolve => {
        fs.stat(file, (err, stats) => {
            if(err) {
                console.error('rollup-plugin-gzip: Error reading file ' + file);
                resolve();
                return;
            }

            if(minSize && minSize > stats.size) {
                resolve();
            }
            else {
                const compressor = (algorithm === 'zopfli')
                    ? require('node-zopfli')
                    : require('zlib');

                fs.createReadStream(file)
                    .pipe(compressor.createGzip(options))
                    .pipe(fs.createWriteStream(file + '.gz'))
                    .on('close', () => resolve());
            }
        });
    });
}

export default function gzip(options) {
    options = options || {};

    const algorithm = options.algorithm || 'zlib';
    const gzipOptions = options.options;
    const additionalFiles = options.additional || [];
    const minSize = options.minSize || 0;

    let delay = options.delay || 0;

    if ( options.delay === undefined && options.additional && VERSION >= '0.60.0' /* && VERSION <= '0.62.0' */) {
        delay = 5000;
        console.warn('[rollup-plugin-gzip] This version of rollup does not guarantee that plugins are executed in the right order!');
        console.warn('As you have specified additional resources to be compressed, we assume a default delay of 5000ms.');
        console.warn('To change, set a "delay" value for this plugin.');
    }

    return {
        name: 'gzip',

        onwrite: function(buildOpts, bundle) {

            // fallback to .dest for rollup < 0.48
            const outBundle = buildOpts.file || buildOpts.dest;

            // we have to read from the actual written bundle file rather than use bundle.code
            // as it does not contain the source map comment
            const filesToCompress = [ outBundle ].concat(additionalFiles);

            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(Promise.all(filesToCompress.map(
                        file => gzipCompressFile(file, algorithm, gzipOptions, minSize))));
                }, delay);
            });
        }
    };
}
