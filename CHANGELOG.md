# Changelog

## v1.4.0 (2018-06-29)

* Add experimental support for compressing chunks when using code splitting
* Add `delay` option for additional files that are written outside the plugin lifecycle
* Assume a default delay of 5000ms in rollup 0.60.0-0.62.0 as a workaround for changed behavior (fixes #2)
* Remove dependency to `node-zopfli` to prevent installing it by default which is failing at the moment (fixes #3)


## v1.3.0 (2017-08-21)

* Compatibility with rollup 0.48
* Update TypeScript typings


## v1.2.0 (2017-06-17)

Added `algorithm: 'zopfli'`


## v1.1.0 (2017-04-08)

Added TypeScript typings

## v1.0.0 (2017-01-19)

Initial release