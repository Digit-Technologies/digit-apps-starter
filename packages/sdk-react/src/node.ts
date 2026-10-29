/**
 * Node entry (the `node` export condition): the same public API as ./index.ts without the font
 * stylesheet, which only a bundler can load.
 */
export * from "./exports.js"
