// Codegen: regenerate the `MindElixir` class's option + prototype-method field
// declarations (the `// #region GENERATED` block in src/index.ts) with fully
// expanded signatures. This keeps the published .d.ts and the API docs showing
// real types (e.g. `(tpcs: Topic<M>[], to: Topic<M>) => Promise<void>`)
// instead of the DRY indexed-access aliases the class would
// otherwise carry (`MindElixirMethods['copyNodes']`, `ResolvedOptions['...']`).
//
// Source of truth: the TypeScript checker, run directly over `src` via the
// compiler API — no build step required.
// - methods: the inferred type of the `methods` object in src/methods.ts.
//   Each property (including the `typeof X` utility entries and the spread-in
//   modules) is printed as its resolved call signature, with src/index.ts as
//   the enclosing scope so type names resolve to the imports already there.
// - options: the `Options` interface in src/types/index.ts, type text copied
//   verbatim from source, minus the members refined by hand on the class
//   (el/theme/markdown/imageProxy).
//
// Signatures are only cosmetically cleaned: `import("./x").` prefixes are
// stripped and the private `PathString` alias is inlined to `string`. The
// referenced types are imported by hand in src/index.ts; a new/renamed type
// simply fails the build loudly. The compile-time guards in src/index.ts keep
// this block exhaustive and in sync with the source types.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import ts from 'typescript-5'

const here = dirname(fileURLToPath(import.meta.url))
const indexPath = join(here, 'src', 'index.ts')

// Options refined by hand on the class (excluded from the generated block).
const OMITTED_OPTIONS = new Set(['el', 'theme', 'markdown', 'imageProxy'])

const START = '  // #region GENERATED members'
const END = '  // #endregion GENERATED'

// --- cleaning ------------------------------------------------------------
const stripImports = s => s.replace(/import\((?:"[^"]*"|'[^']*')\)\./g, '')
const inlineAliases = s => s.replace(/\bPathString\b/g, 'string')
const oneLine = s => s.replace(/\s+/g, ' ').trim()
const clean = s => {
  const text = oneLine(inlineAliases(stripImports(s)))
  return text
    .replace(/\b(MindElixir|MindElixirData|NodeObj|NodeObjExport|Topic|Arrow|Theme)<any>/g, '$1<M>')
    .replace(/\b(MindElixir|MindElixirData|NodeObj|NodeObjExport|Topic|Arrow|Theme)\b(?!<)/g, '$1<M>')
}

// A generated method is declared as a member of the class, so its explicit
// `this` parameter is redundant. Keep `this` in Options/Theme callbacks: those
// are user-provided functions whose callback context is part of the API.
const cleanMethod = s => clean(s).replace(/^\(this:\s*(?:Partial<)?MindElixir<M>>?(?:,\s*)?/, '(')

// --- type checker over src -------------------------------------------------
const configFile = ts.readConfigFile(join(here, 'tsconfig.json'), ts.sys.readFile)
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, here)
const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true, emitDeclarationOnly: false })
const checker = program.getTypeChecker()

const getSource = rel => {
  const abs = join(here, 'src', rel).replace(/\\/g, '/')
  const sf = program.getSourceFiles().find(f => f.fileName.replace(/\\/g, '/').toLowerCase() === abs.toLowerCase())
  if (!sf) throw new Error(`source file not found in program: src/${rel}`)
  return sf
}

const indexSf = getSource('index.ts')

// Print a type with src/index.ts as the enclosing scope, fully expanded.
const typeText = type => clean(checker.typeToString(type, indexSf, ts.TypeFormatFlags.NoTruncation))

// --- gather signatures ---------------------------------------------------
// methods: expand every property of the inferred `methods` object type.
const methodsSf = getSource('methods.ts')
let methodsDecl
methodsSf.forEachChild(node => {
  if (!ts.isVariableStatement(node)) return
  for (const d of node.declarationList.declarations) {
    if (ts.isIdentifier(d.name) && d.name.text === 'methods') methodsDecl = d
  }
})
if (!methodsDecl) throw new Error('`const methods` not found in src/methods.ts')

const methodsType = checker.getTypeAtLocation(methodsDecl.name)
const methods = checker.getPropertiesOfType(methodsType).map(prop => ({
  name: prop.getName(),
  type: cleanMethod(typeText(checker.getTypeOfSymbolAtLocation(prop, methodsDecl))),
}))
if (!methods.length) throw new Error('no methods resolved from src/methods.ts')

// options: copy the declared type text of each `Options` member verbatim.
const typesSf = getSource('types/index.ts')
let optionsDecl
typesSf.forEachChild(node => {
  if (ts.isInterfaceDeclaration(node) && node.name.text === 'Options') optionsDecl = node
})
if (!optionsDecl) throw new Error('`interface Options` not found in src/types/index.ts')

const options = []
for (const member of optionsDecl.members) {
  if (!ts.isPropertySignature(member) || !member.type) continue
  const name = member.name.getText(typesSf)
  if (OMITTED_OPTIONS.has(name)) continue
  options.push({ name, type: clean(member.type.getText(typesSf)) })
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

const index = readFileSync(indexPath, 'utf8')
const startAt = index.indexOf(START)
const endAt = index.indexOf(END)
if (startAt < 0 || endAt < 0) throw new Error('GENERATED markers not found in src/index.ts')
const patched = index.slice(0, startAt) + region + index.slice(endAt + END.length)

writeFileSync(indexPath, patched)

console.log(`Generated ${options.length} option + ${methods.length} method declarations into src/index.ts.`)
