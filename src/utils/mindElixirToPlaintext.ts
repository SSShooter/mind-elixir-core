import type { MindElixirData, NodeObj } from '../types'
import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
import type { NodePlaintextMeta, ArrowPlaintextMeta } from './plaintextToMindElixir'

type PtElement = { type: 'arrow'; arrow: Arrow } | { type: 'summary'; summary: Summary }

class PtTree {
  node: NodeObj
  children: PtTree[] = []
  // slots[i] represents elements that appear *before* children[i]
  // slots[children.length] represents elements that appear *after* all children
  slots: PtElement[][]

  constructor(node: NodeObj) {
    this.node = node
    const childLen = node.children?.length ?? 0
    this.slots = Array.from({ length: childLen + 1 }, () => [])
  }
}

/**
 * Convert MindElixirData back to plaintext format
 *
 * @param data - The MindElixirData object to convert
 * @returns Plaintext string
 */
export function mindElixirToPlaintext(data: MindElixirData): string {
  const { nodeData, arrows = [], summaries = [] } = data

  const treeMap = new Map<string, PtTree>()

  // 1. Build plaintext node tree
  function buildTree(n: NodeObj): PtTree {
    const tree = new PtTree(n)
    treeMap.set(n.id, tree)
    if (n.children) {
      tree.children = n.children.map(buildTree)
    }
    return tree
  }

  const rootTree = buildTree(nodeData)

  const rootArrows: Arrow[] = []
  const referencedIds = new Set<string>()

  // 2. Insert arrows into plaintext nodes
  for (const arrow of arrows) {
    referencedIds.add(arrow.from)
    referencedIds.add(arrow.to)

    const meta = arrow.metadata as ArrowPlaintextMeta | undefined
    const parentId = meta?.parentId
    const index = meta?.index ?? Infinity

    if (!parentId) {
      rootArrows.push(arrow)
      continue
    }

    const parentTree = treeMap.get(parentId)
    if (parentTree) {
      const slotIndex = Math.min(index, parentTree.children.length)
      parentTree.slots[slotIndex].push({ type: 'arrow', arrow })
    } else {
      rootArrows.push(arrow)
    }
  }

  // 3. Insert summaries into plaintext nodes
  for (const summary of summaries) {
    const parentTree = treeMap.get(summary.parent)
    if (parentTree) {
      // Summary of [start, end] is placed AFTER the child at `end`
      // which corresponds to slot `end + 1`
      const slotIndex = Math.min(summary.end + 1, parentTree.children.length)
      parentTree.slots[slotIndex].push({ type: 'summary', summary })
    }
  }

  function getRefId(id: string): string {
    const meta = treeMap.get(id)?.node.metadata as NodePlaintextMeta | undefined
    return meta?.refId ?? id
  }

  const lines: string[] = []

  // 4. Traverse and convert to string
  function dump(tree: PtTree, depth: number) {
    const indent = '  '.repeat(depth)
    const childIndent = '  '.repeat(depth + 1)

    // Node itself
    const meta = tree.node.metadata as NodePlaintextMeta | undefined
    const parts = [tree.node.topic]

    const refId = meta?.refId ?? (referencedIds.has(tree.node.id) ? tree.node.id : undefined)
    if (refId) parts.push(`[^${refId}]`)

    if (tree.node.style && Object.keys(tree.node.style).length > 0) {
      parts.push(JSON.stringify(tree.node.style))
    }
    lines.push(`${indent}- ${parts.join(' ')}`)

    // Slots and children
    for (let i = 0; i <= tree.children.length; i++) {
      for (const el of tree.slots[i]) {
        if (el.type === 'arrow') {
          const a = el.arrow
          const connector = a.bidirectional ? `<-${a.label ?? ''}->` : `>-${a.label ?? ''}->`
          lines.push(`${childIndent}- > [^${getRefId(a.from)}] ${connector} [^${getRefId(a.to)}]`)
        } else if (el.type === 'summary') {
          const s = el.summary
          const count = s.end - s.start + 1
          const countAnnotation = count === tree.children.length ? '' : `:${count} `
          lines.push(`${childIndent}- }${countAnnotation}${s.label}`)
        }
      }

      if (i < tree.children.length) {
        dump(tree.children[i], depth + 1)
      }
    }
  }

  dump(rootTree, 0)

  // Emit root-level arrows
  for (const a of rootArrows) {
    const connector = a.bidirectional ? `<-${a.label ?? ''}->` : `>-${a.label ?? ''}->`
    lines.push(`- > [^${getRefId(a.from)}] ${connector} [^${getRefId(a.to)}]`)
  }

  return lines.join('\n') + '\n'
}
