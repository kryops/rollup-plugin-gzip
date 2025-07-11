# Changelog

## v4.1.1 (2025-06-14)

- Fix source maps for Rollup 2

## v4.1.0 (2025-06-14)

- Add support for `rolldown-vite` ([#23](https://github.com/kryops/rollup-plugin-gzip/issues/23))

## v4.0.0 (2024-07-21)

**MAYBE BREAKING CHANGES**

- Switch to `type: "module"` ([#22](https://github.com/kryops/rollup-plugin-gzip/issues/22))

## v3.1.2 (2024-03-15)

- Fix support for `sourcemap: 'hidden'` ([#21](https://github.com/kryops/rollup-plugin-gzip/issues/21))

## v3.1.1 (2023-12-28)

- Compress `.svg` files by default ([#20](https://github.com/kryops/rollup-plugin-gzip/pull/20))

## v3.1.0 (2022-10-23)

- Add support for Rollup 3

## v3.0.1 (2022-04-02)

- Compress `.cjs` and `.wasm` files by default ([#19](https://github.com/kryops/rollup-plugin-gzip/issues/19))

## v3.0.0 (2021-11-13)

**BREAKING CHANGES**

- Drop support for rollup version < 2.0.0

New features

- Vite compatibility ([#18](https://github.com/kryops/rollup-plugin-gzip/issues/18))

## v2.5.0 (2020-05-06)

- Compress HTML files by default ([@dilyanpalauzov](https://github.com/dilyanpalauzov) in [#14](https://github.com/kryops/rollup-plugin-gzip/pull/14))

## v2.4.0 (2020-04-10)

- Provide conditional module exports for ESM ([#12](https://github.com/kryops/rollup-plugin-gzip/issues/12))
- Default `additionalFilesDelay` to `0` for Rollup >= 2.0.0 ([#9](https://github.com/kryops/rollup-plugin-gzip/issues/9))

## v2.3.0 (2020-02-02)

- Add `type: 'asset'` to bundle asset entries for rollup >= 1.21.0

## v2.2.0 (2018-12-29)

- Add support for rollup 1.0.0

## v2.1.0 (2018-12-19)

- Add support for `.mjs` bundles ([@ashuanindian](https://github.com/ashuanindian) in [#5](https://github.com/kryops/rollup-plugin-gzip/pull/5))

## v2.0.0 (2018-07-28)

**BREAKING CHANGES**

- Drop support for rollup version < 0.60.0
- Drop `algorithm` option. Use `customCompression` instead
- Rename `options` option to `gzipOptions`
- Rename `additional` option to `additionalFiles`
- Rename `delay` option to `additionalFilesDelay`

New Features

- Add `filter` option to control which chunks should be compressed
- Add `customCompression` option for providing a custom compression algorithm
- Add `fileName` option for controlling the compressed file names (defaults to `.gz`)

Internal Changes

- Convert code base to TypeScript
- Add linting and auto-formatting

## v1.4.0 (2018-06-29)

- Add experimental support for compressing chunks when using code splitting
- Add `delay` option for additional files that are written outside the plugin lifecycle
- Assume a default delay of 5000ms in rollup 0.60.0-0.62.0 as a workaround for changed behavior (fixes #2)
- Remove dependency to `node-zopfli` to prevent installing it by default which is failing at the moment (fixes #3)

## v1.3.0 (2017-08-21)

- Compatibility with rollup 0.48
- Update TypeScript typings

## v1.2.0 (2017-06-17)

Added `algorithm: 'zopfli'`

## v1.1.0 (2017-04-08)

Added TypeScript typings

## v1.0.0 (2017-01-19)

Initial release
