/// <reference path="./css.d.ts" />
/**
 * Browser entry: the public API in ./exports.ts plus the self-hosted Inter variable font
 * (inter-ui, the face digit-web loads). Vite bundles the stylesheet, and the pack build rewrites
 * its font URLs onto /app/ so they are font-src 'self'.
 *
 * Node resolves the package's `node` export condition to ./node.ts instead, which leaves the
 * stylesheet out: plain Node can't import CSS, so SSR, tests and scripts would crash on it.
 */
import "inter-ui/inter-variable.css"

export * from "./exports.js"
