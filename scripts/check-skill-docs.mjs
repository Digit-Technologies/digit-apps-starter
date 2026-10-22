#!/usr/bin/env node
// Checks that the create-digit-app skill only documents components, props and prop values that
// exist. It collects every component usage in the skill's markdown (JSX in ```tsx blocks, and
// inline spans such as `SettingsRow variant="form"`), writes a TypeScript probe that asserts each
// one against @digit/lib-frontend and @mui/material, and type-checks it. Run after changing a
// component's API: `npm run check:skill-docs`.
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const skillDir = join(root, ".agents/skills/create-digit-app")
const docs = [
  join(skillDir, "SKILL.md"),
  ...readdirSync(join(skillDir, "reference")).map((f) => join(skillDir, "reference", f)),
].filter((f) => f.endsWith(".md"))

// Names the docs may use: library exports (components, icons, types) and MUI components.
// Docs import MUI components under a `Mui` prefix when the library has a component of the same
// name (`import MuiSwitch from "@mui/material/Switch"`).
const exportedNames = (file) =>
  [...readFileSync(join(root, file), "utf8").matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)].flatMap(
    (m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean),
  )
const libNames = new Set([
  ...exportedNames("packages/lib-frontend/src/index.ts"),
  ...exportedNames("packages/lib-frontend/src/icons.ts"),
])
const muiNames = new Set(
  [...readFileSync(join(root, "node_modules/@mui/material/index.d.ts"), "utf8").matchAll(/default as (\w+)/g)].map(
    (m) => m[1],
  ),
)
const isKnown = (name) => libNames.has(name) || muiNames.has(name) || muiNames.has(name.replace(/^Mui/, ""))
// Components a recipe uses as stand-ins for the app's own code.
const appLocal = new Set(["App", "OrderPanel"])

// Reads one JSX attribute value starting at text[i] ("…" or {…}); returns [value, nextIndex].
function readValue(text, i) {
  if (text[i] === '"') {
    const end = text.indexOf('"', i + 1)
    return [{ literal: text.slice(i + 1, end) }, end + 1]
  }
  if (text[i] === "{") {
    let depth = 0
    for (let j = i; j < text.length; j++) {
      if (text[j] === "{") depth++
      else if (text[j] === "}" && --depth === 0) return [{ expression: true }, j + 1]
    }
  }
  return [null, i]
}

// Parses `Name attr attr="x" attr={…}` at text[i]; returns { name, props } or null.
function readUsage(text, i, { inJsx }) {
  const nameMatch = /^[A-Z][A-Za-z0-9]*/.exec(text.slice(i))
  if (!nameMatch) return null
  const name = nameMatch[0]
  let j = i + name.length
  const props = []
  for (;;) {
    const ws = /^\s+/.exec(text.slice(j))
    if (!ws) break
    const attr = /^[a-z][A-Za-z0-9-]*/.exec(text.slice(j + ws[0].length))
    if (!attr) break
    j += ws[0].length + attr[0].length
    if (text[j] === "=") {
      const [value, next] = readValue(text, j + 1)
      if (!value) break
      props.push({ key: attr[0], ...value })
      j = next
    } else {
      // In JSX a bare attribute is `true`; in prose (`SettingsSection selection`) it names a prop.
      props.push({ key: attr[0], ...(inJsx ? { literal: true } : { expression: true }) })
    }
  }
  return { name, props: props.filter((p) => p.key !== "key" && p.key !== "ref") }
}

const usages = []
const unknown = []
for (const file of docs) {
  const text = readFileSync(file, "utf8")
  const lineAt = (index) => text.slice(0, index).split("\n").length
  const where = (index) => `${relative(root, file)}:${lineAt(index)}`
  const fenced = /```tsx\n([\s\S]*?)```/g
  const codeRanges = []
  for (const block of text.matchAll(fenced)) {
    const start = block.index + block[0].indexOf("\n") + 1
    codeRanges.push([block.index, block.index + block[0].length])
    const defined = new Set([...block[1].matchAll(/(?:function|const)\s+([A-Z]\w*)/g)].map((m) => m[1]))
    for (const tag of block[1].matchAll(/(?<![A-Za-z0-9_])<(?=[A-Z])/g)) {
      const usage = readUsage(text, start + tag.index + 1, { inJsx: true })
      if (!usage || defined.has(usage.name) || appLocal.has(usage.name)) continue
      if (isKnown(usage.name)) usages.push({ ...usage, where: where(start + tag.index) })
      else unknown.push(`${where(start + tag.index)}: <${usage.name}> is not exported by @digit/lib-frontend or @mui/material`)
    }
  }
  // Inline spans: only names the docs could mean as components, such as `Pill status`.
  for (const span of text.matchAll(/`([^`\n]+)`/g)) {
    if (codeRanges.some(([a, b]) => span.index >= a && span.index < b)) continue
    const usage = readUsage(span[1].replace(/^</, ""), 0, { inJsx: span[1].startsWith("<") })
    if (usage && usage.props.length > 0 && isKnown(usage.name)) usages.push({ ...usage, where: where(span.index) })
  }
}

const lines = [
  `import type * as React from "react"`,
  `import * as Lib from "@digit/lib-frontend"`,
  `import * as Mui from "@mui/material"`,
  `type Lookup<N extends string> = N extends keyof typeof Lib ? (typeof Lib)[N] : N extends keyof typeof Mui ? (typeof Mui)[N] : N extends \`Mui\${infer M}\` ? (M extends keyof typeof Mui ? (typeof Mui)[M] : never) : never`,
  `type Exists<N extends string> = [Lookup<N>] extends [never] ? false : true`,
  `type Props<N extends string> = Lookup<N> extends React.JSXElementConstructor<infer P> ? P : never`,
  `type Keys<T> = T extends unknown ? keyof T : never`,
  `type Value<T, K extends PropertyKey> = T extends unknown ? (K extends keyof T ? T[K] : never) : never`,
  `export {}`,
]
const seen = new Set()
for (const u of usages) {
  const id = JSON.stringify([u.name, u.props])
  if (seen.has(id)) continue
  seen.add(id)
  lines.push(`// ${u.where}`)
  lines.push(`{ const e: Exists<${JSON.stringify(u.name)}> = true; void e }`)
  for (const p of u.props) {
    const k = JSON.stringify(p.key)
    lines.push(`{ const k: Keys<Props<${JSON.stringify(u.name)}>> = ${k}; void k }`)
    if (p.literal !== undefined && !p.expression) {
      lines.push(
        `{ const v: Value<Props<${JSON.stringify(u.name)}>, ${k}> = ${JSON.stringify(p.literal)}; void v }`,
      )
    }
  }
}

const probeDir = join(root, ".skill-docs-check")
rmSync(probeDir, { recursive: true, force: true })
mkdirSync(probeDir)
writeFileSync(join(probeDir, "probe.tsx"), lines.join("\n") + "\n")
writeFileSync(
  join(probeDir, "tsconfig.json"),
  JSON.stringify({
    extends: "../packages/lib-frontend/tsconfig.json",
    compilerOptions: { declaration: false, declarationMap: false },
    include: ["probe.tsx", "../packages/lib-frontend/src"],
  }),
)

let failed = unknown.length > 0
for (const message of unknown) console.error(message)
try {
  execFileSync("npx", ["tsc", "-p", join(probeDir, "tsconfig.json"), "--pretty", "false"], {
    cwd: root,
    encoding: "utf8",
  })
} catch (error) {
  failed = true
  const probe = readFileSync(join(probeDir, "probe.tsx"), "utf8").split("\n")
  for (const line of `${error.stdout}`.split("\n")) {
    const m = /probe\.tsx\((\d+),\d+\): (.*)/.exec(line)
    if (!m) {
      if (line.trim()) console.error(line)
      continue
    }
    let n = Number(m[1]) - 1
    while (n > 0 && !probe[n].startsWith("// ")) n--
    console.error(`${probe[n].slice(3)}: ${probe[Number(m[1]) - 1].trim()}\n  ${m[2]}`)
  }
}
rmSync(probeDir, { recursive: true, force: true })
console.log(failed ? "Skill docs reference APIs that don't exist." : `Checked ${seen.size} usages.`)
process.exit(failed ? 1 : 0)
