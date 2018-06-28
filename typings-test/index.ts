import gzip from 'rollup-plugin-gzip';

const plugin = gzip({
    options: {
        level: 9
    },
    additional: [
        'test/__output/test1.txt',
        'test/__output/test2.txt'
    ],
    minSize: 1000,
    delay: 5000
})

const name = plugin.name

plugin.onwrite(
    {
        dest: 'bar'
    },
    'bundle'
).then(() => {
    console.log('complete')
})

gzip({
    algorithm: 'zlib'
})

gzip({
    algorithm: 'zopfli'
})

gzip({
    algorithm: 'zopfli',
    options: {
        verbose: true,
        verbose_more: true,
        numiterations: 1,
        blocksplitting: true,
        blocksplittinglast: true,
        blocksplittingmax: 1
    }
})
