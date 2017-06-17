import { ZlibOptions } from 'zlib'

export interface OptionsBase {

    /** Compress additional files */
    additional?: string[]

    /** Minimum size for compression */
    minSize?: number
}

export interface OptionsZlib extends OptionsBase {

    algorithm: 'zlib' | undefined

     /** Gzip compression options */
    options?: ZlibOptions
}

export interface OptionsZopfli extends OptionsBase {

    algorithm: 'zopfli'

    /** Zopfli compression options */
    options?: {
        verbose?: boolean
        verbose_more?: boolean
        numiterations?: number
        blocksplitting?: boolean
        blocksplittinglast?: boolean
        blocksplittingmax?: number
    }
}

export type Options = OptionsZlib | OptionsZopfli

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
