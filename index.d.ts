import { ZlibOptions } from 'zlib'

export interface Options {

    /** Gzip compression options */
    options?: ZlibOptions

    /** Compress additional files */
    additional?: string[]

    /** Minimum size for compression */
    minSize?: number
}

interface Plugin {
    name: string
    onwrite: (
        buildOpts: {
            dest: string
        },
        bundle: any
    ) => Promise<any>
}

declare const gzip: (options?: Options) => Plugin

export default gzip
