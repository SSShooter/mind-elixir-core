// Codegen: regenerate the `MindElixir` class's option + prototype-method field
// declarations (the `// #region GENERATED` block in src/index.ts) with fully
// expanded signatures. This keeps the published .d.ts and the API docs showing
// real types (e.g. `(this: MindElixirInstance, tpcs: Topic[], to: Topic) =>
// Promise<void>`) instead of the DRY indexed-access aliases the class would
// otherwise carry (`MindElixirMethods['copyNodes']`, `ResolvedOptions['...']`).
//
// Source of truth: the compiled declarations in dist/types (run `tsc` first).
// - methods: the `methods` object in dist/types/methods.d.ts. The dozen
//   `typeof X` utility entries are resolved to their real signatures from the
//   module that defines them.
// - options: the `Options` interface in dist/types/types/index.d.ts, minus the
//   members refined by hand on the class (el/theme/markdown/imageProxy).
//
// Signatures are copied verbatim and only cosmetically cleaned: `import("./x").`
// and `summary.`/`arrow.` namespace prefixes are stripped and the private
// `PathString` alias is inlined to `string`. The referenced types are imported
// by hand in src/index.ts; a new/renamed type simply fails the build loudly.
// The compile-time guards in src/index.ts keep this block exhaustive and in
// sync with the source types.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import prettier from 'prettier'

const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, 'dist', 'types')
const indexPath = join(here, 'src', 'index.ts')
const read = p => readFileSync(p, 'utf8')

// Options refined by hand on the class (excluded from the generated block).
const OMITTED_OPTIONS = new Set(['el', 'theme', 'markdown', 'imageProxy'])

// Modules (relative to dist/types) that define the `typeof X` utility methods.
const UTIL_MODULE = {
  getObjById: 'utils/index',
  generateNewObj: 'utils/index',
  layout: 'utils/layout',
  linkDiv: 'linkDiv',
  editTopic: 'utils/dom',
  createWrapper: 'utils/dom',
  createParent: 'utils/dom',
  createChildren: 'utils/dom',
  createTopic: 'utils/dom',
  findEle: 'utils/dom',
  changeTheme: 'utils/theme',
  changeCompact: 'utils/theme',
}

const START = '  // #region GENERATED members'
const END = '  // #endregion GENERATED'

// --- cleaning ------------------------------------------------------------
const stripImports = s => s.replace(/import\((?:"[^"]*"|'[^']*')\)\./g, '')
const stripNs = s => s.replace(/\b(?:summary|arrow)\./g, '')
const inlineAliases = s => s.replace(/\bPathString\b/g, 'string')
const oneLine = s => s.replace(/\s+/g, ' ').trim()
const clean = s => oneLine(inlineAliases(stripNs(stripImports(s))))

// Drop block and line comments so the splitter only sees declarations.
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

// Read a balanced type expression from `src` starting at `from`, stopping at a
// depth-0 `;`. Tracks (){}[]<> nesting and strings and treats `=>` as an atom
// so its `>` is never mistaken for a generic close.
const readType = (src, from) => {
  let depth = 0
  let quote = null
  let i = from
  for (; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === quote && src[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '=' && src[i + 1] === '>') i++
    else if (c === '(' || c === '[' || c === '{' || c === '<') depth++
    else if (c === ')' || c === ']' || c === '}' || c === '>') depth--
    else if (c === ';' && depth === 0) break
  }
  return src.slice(from, i)
}

// Split an object/interface body into members at depth-0 `;`.
const splitMembers = inner => {
  const parts = []
  let depth = 0
  let start = 0
  let quote = null
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (quote) {
      if (c === quote && inner[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '=' && inner[i + 1] === '>') i++
    else if (c === '(' || c === '[' || c === '{' || c === '<') depth++
    else if (c === ')' || c === ']' || c === '}' || c === '>') depth--
    else if (c === ';' && depth === 0) {
      parts.push(inner.slice(start, i))
      start = i + 1
    }
  }
  const tail = inner.slice(start)
  if (tail.trim()) parts.push(tail)
  return parts
}

// Parse `name: type` or `name(params): ret` (method form -> arrow type).
const parseMember = seg => {
  const s = seg.trim()
  const m = /^([A-Za-z0-9_$]+)\??/.exec(s)
  if (!m) return null
  const name = m[1]
  const rest = s.slice(m[0].length).replace(/^\s+/, '')
  if (rest[0] === ':') return { name, type: rest.slice(1).trim() }
  if (rest[0] === '(') {
    // Method form: find the end of the parameter list.
    let depth = 0
    let quote = null
    let i = 0
    for (; i < rest.length; i++) {
      const c = rest[i]
      if (quote) {
        if (c === quote && rest[i - 1] !== '\\') quote = null
        continue
      }
      if (c === '"' || c === "'" || c === '`') quote = c
      else if (c === '(') depth++
      else if (c === ')' && --depth === 0) {
        i++
        break
      }
    }
    const params = rest.slice(0, i)
    const after = rest.slice(i).replace(/^\s+/, '')
    const ret = after[0] === ':' ? after.slice(1).trim() : 'void'
    return { name, type: `${params} => ${ret}` }
  }
  return null
}

// Extract the body inside the first `{...}` at/after `marker` in `src`.
const extractBody = (src, marker) => {
  const at = src.indexOf(marker)
  if (at < 0) throw new Error(`marker not found: ${marker}`)
  const open = src.indexOf('{', at)
  let depth = 0
  let quote = null
  for (let i = open; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === quote && src[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return src.slice(open + 1, i)
  }
  throw new Error(`unbalanced braces after: ${marker}`)
}

// Resolve a `typeof X` utility method to its real signature from dist/types.
const resolveUtil = name => {
  const mod = UTIL_MODULE[name]
  if (!mod) throw new Error(`no dist/types module mapped for \`typeof ${name}\``)
  const src = read(join(dist, `${mod}.d.ts`))
  const m = new RegExp(`declare const ${name}\\s*:`).exec(src)
  if (!m) throw new Error(`could not find \`declare const ${name}\` in ${mod}.d.ts`)
  return readType(src, m.index + m[0].length)
}

// --- gather signatures ---------------------------------------------------
const methodsBody = stripComments(extractBody(read(join(dist, 'methods.d.ts')), 'declare const methods'))
const methods = []
for (const seg of splitMembers(methodsBody)) {
  const parsed = parseMember(seg)
  if (!parsed) continue
  const typeofMatch = /^typeof\s+([A-Za-z0-9_$]+)$/.exec(parsed.type.trim())
  const type = typeofMatch ? resolveUtil(typeofMatch[1]) : parsed.type
  methods.push({ name: parsed.name, type: clean(type) })
}

const optionsBody = stripComments(extractBody(read(join(dist, 'types', 'index.d.ts')), 'export interface Options'))
const options = []
for (const seg of splitMembers(optionsBody)) {
  const parsed = parseMember(seg)
  if (!parsed || OMITTED_OPTIONS.has(parsed.name)) continue
  options.push({ name: parsed.name, type: clean(parsed.type) })
}

// --- render --------------------------------------------------------------
const lines = [
  `${START} — do not edit by hand; run \`npm run gen:members\`.`,
  '  // Resolved constructor options (defaults are applied in the constructor).',
  ...options.map(o => `  declare ${o.name}: ${o.type}`),
  '',
  '  // Methods mixed into the prototype via `Object.assign` (see ./methods).',
  ...methods.map(m => `  declare ${m.name}: ${m.type}`),
  END,
]
const region = lines.join('\n')

const index = read(indexPath)
const startAt = index.indexOf(START)
const endAt = index.indexOf(END)
if (startAt < 0 || endAt < 0) throw new Error('GENERATED markers not found in src/index.ts')
const patched = index.slice(0, startAt) + region + index.slice(endAt + END.length)

// Format so the committed source stays clean and re-runs are idempotent.
const config = (await prettier.resolveConfig(indexPath)) ?? {}
const formatted = await prettier.format(patched, { ...config, filepath: indexPath })
writeFileSync(indexPath, formatted)

console.log(`Generated ${options.length} option + ${methods.length} method declarations into src/index.ts.`)
