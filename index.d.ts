import { ZlibOptions } from 'zlib'

declare namespace RollupPluginGzip {
    interface OptionsBase {
    
        /** Compress additional files */
        additional?: string[]
    
        /** Minimum size for compression [bytes] */
        minSize?: number

        /** Delay starting the compression for additional assets that are written late [ms] */
        delay?: number
    }
    
    export interface OptionsZlib extends OptionsBase {
    
        algorithm?: 'zlib'
    
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
}

declare const gzip: (options?: RollupPluginGzip.Options) => RollupPluginGzip.Plugin

export default gzip
