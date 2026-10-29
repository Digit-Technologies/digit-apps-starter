import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import * as browser from "./index.js"
import * as node from "./node.js"

// jsdom replaces URL, and fs only takes Node's, so read by path
const read = (relative: string) => readFileSync(new URL(relative, import.meta.url).pathname, "utf8")

describe("node entry", () => {
  it("exports the same API as the browser entry", () => {
    expect(Object.keys(node).sort()).toEqual(Object.keys(browser).sort())
  })

  it("leaves the font stylesheet to the browser entry", () => {
    const css = /import\s+["'][^"']+\.css["']/
    expect(read("./node.ts")).not.toMatch(css)
    expect(read("./exports.ts")).not.toMatch(css)
    expect(read("./index.ts")).toMatch(css)
  })

  it("is what Node resolves, ahead of the browser import", () => {
    const pkg = JSON.parse(read("../package.json"))
    expect(Object.keys(pkg.exports["."])).toEqual(["types", "node", "import"])
    expect(pkg.exports["."].node).toBe("./dist/node.js")
  })
})
