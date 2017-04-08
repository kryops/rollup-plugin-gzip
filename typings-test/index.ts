import gzip from 'rollup-plugin-gzip';

const plugin = gzip({
    options: {
        level: 9
    },
    additional: [
        'test/__output/test1.txt',
        'test/__output/test2.txt'
    ],
    minSize: 1000
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
