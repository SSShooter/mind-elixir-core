import type { MindElixirData, NodeObj } from '../types'
import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
import { generateUUID } from '.'

export interface NodePlaintextMeta {
  refId: string
}

export interface ArrowPlaintextMeta {
  parentId: string | null
  index: number
}

interface ParseContext {
  arrowLines: { content: string; parentId: string | null; index: number }[]
  nodeIdMap: Map<string, string> // maps [^id] to actual node id
}

interface ParsedLine {
  type: 'node' | 'arrow' | 'summary'
  topic: string
  content: string
  refId?: string
  style?: NodeObj['style']
}

export const plaintextExample = `- Root Node
  - Child Node 1
    - Child Node 1-1 {"color": "#e87a90", "fontSize": "18px"}
    - Child Node 1-2
    - Child Node 1-3
    - }:2 Summary of first two nodes
  - Child Node 2
    - Child Node 2-1 [^node-2-1]
    - Child Node 2-2 [^id2]
    - Child Node 2-3
    - > [^node-2-1] <-Bidirectional Link-> [^id2]
  - Child Node 3
    - Child Node 3-1 [^id3]
    - Child Node 3-2 [^id4]
    - Child Node 3-3 [^id5] {"fontFamily": "Arial", "fontWeight": "bold"}
    - > [^id3] >-Unidirectional Link-> [^id4]
  - Child Node 4
    - Child Node 4-1 [^id6]
    - Child Node 4-2 [^id7]
    - Child Node 4-3 [^id8]
    - } Summary of all previous nodes
    - Child Node 4-4
- > [^node-2-1] <-Link position is not restricted, as long as the id can be found during rendering-> [^id8]

`

/**
 * Convert plaintext format to MindElixirData
 *
 * Format:
 * - Root node
 *   - Child 1
 *     - Child 1-1 [^id1]
 *     - Child 1-2 {"color": "#e87a90", "fontSize": "18px", "fontFamily": "Arial"}
 *     - }:2 Summary of first two nodes
 *   - Child 2 [^id2]
 *     - > [^id1] <-label-> [^id2]
 *
 * When the plaintext contains more than one top-level node, a synthetic root
 * node is automatically created to wrap them as first-level children.
 *
 * @param plaintext - The plaintext string to convert
 * @param rootName - Optional name for the synthetic root node when multiple
 *   top-level nodes are detected (defaults to 'Root')
 * @returns MindElixirData object
 */
export function plaintextToMindElixir(plaintext: string, rootName = 'Root'): MindElixirData {
  const lines = plaintext.split('\n').filter(line => line.trim())

  if (lines.length === 0) {
    throw new Error('Failed to parse plaintext: no root node found')
  }

  const context: ParseContext = {
    arrowLines: [],
    nodeIdMap: new Map(),
  }

  const summaries: Summary[] = []

  // Stack tracks the current ancestry path: each entry holds the indent level and the node
  const stack: { indent: number; node: NodeObj }[] = []
  // Collect top-level nodes
  const topLevelNodes: NodeObj[] = []

  // Single pass: iterate through all lines once
  for (const line of lines) {
    const indent = getIndent(line)
    const parsed = parseLine(line)

    // Pop the stack until we find the parent for this indent level
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const parent = stack.length > 0 ? stack[stack.length - 1].node : null
    const parentChildren = parent ? (parent.children ??= []) : topLevelNodes

    if (parsed.type === 'arrow') {
      context.arrowLines.push({
        content: parsed.content,
        parentId: parent?.id ?? null,
        index: parentChildren.length,
      })
      continue
    }

    if (parsed.type === 'summary') {
      const summary = parseSummary(parsed.content, parentChildren, parent?.id ?? '')
      if (summary) summaries.push(summary)
      continue
    }

    // Create node
    const nodeId = generateUUID()
    const node: NodeObj = {
      topic: parsed.topic,
      id: nodeId,
    }

    if (parsed.style) {
      node.style = parsed.style
    }

    if (parsed.refId) {
      context.nodeIdMap.set(parsed.refId, nodeId)
      node.metadata = { refId: parsed.refId } as NodePlaintextMeta
    }

    // Attach to parent or top-level
    parentChildren.push(node)

    // Push onto stack so subsequent deeper lines become children of this node
    stack.push({ indent, node })
  }

  if (topLevelNodes.length === 0) {
    throw new Error('Failed to parse plaintext: no root node found')
  }

  // If there are multiple top-level nodes, wrap them under a synthetic root
  let rootNode: NodeObj
  if (topLevelNodes.length === 1) {
    rootNode = topLevelNodes[0]
  } else {
    rootNode = {
      topic: rootName,
      id: generateUUID(),
      children: topLevelNodes,
    }
  }

  // Process arrows (deferred because they depend on nodeIdMap which is built during the pass)
  const arrows = context.arrowLines
    .map(({ content, parentId, index }) => {
      const arrow = parseArrow(content, context)
      if (arrow) {
        arrow.metadata = { parentId, index } as ArrowPlaintextMeta
      }
      return arrow
    })
    .filter((a): a is Arrow => a !== null)

  return {
    nodeData: rootNode,
    arrows: arrows.length > 0 ? arrows : undefined,
    summaries: summaries.length > 0 ? summaries : undefined,
  }
}

function getIndent(line: string): number {
  const match = line.match(/^(\s*)/)
  return match ? match[1].length : 0
}

function parseStyleObject(styleStr: string): NodeObj['style'] {
  try {
    // Try to parse as JSON (supports both {key: value} and {"key": "value"} formats)
    // Add curly braces if not present
    const jsonStr = styleStr.trim().startsWith('{') ? styleStr : `{${styleStr}}`
    return JSON.parse(jsonStr)
  } catch {
    // If JSON parsing fails, return empty object (invalid style will be ignored)
    return {}
  }
}

function parseLine(line: string): ParsedLine {
  const trimmed = line.trim()

  // First remove the leading dash to get the actual content
  const content = trimmed.replace(/^-\s*/, '')

  // Arrow: > [^id1] <-label-> [^id2]
  if (content.startsWith('>')) {
    return {
      type: 'arrow',
      topic: '',
      content: content.substring(1).trim(),
    }
  }

  // Summary: }:2 label or } label
  if (content.startsWith('}')) {
    return {
      type: 'summary',
      topic: '',
      content: content.substring(1).trim(),
    }
  }

  // Regular node: Node text [^id] {color: #hex}
  let nodeContent = content
  let refId: string | undefined
  let style: NodeObj['style'] | undefined

  // Extract reference ID: [^id]
  const refMatch = nodeContent.match(/\[\^([\w-]+)\]/)
  if (refMatch) {
    refId = refMatch[1]
    nodeContent = nodeContent.replace(refMatch[0], '').trim()
  }

  // Extract style: {color: #hex, fontSize: 16px, fontFamily: Arial, ...}
  const styleMatch = nodeContent.match(/\{([^}]+)\}/)
  if (styleMatch) {
    style = parseStyleObject(styleMatch[1])
    nodeContent = nodeContent.replace(styleMatch[0], '').trim()
  }

  return {
    type: 'node',
    topic: nodeContent,
    content: nodeContent,
    refId,
    style,
  }
}

function parseArrow(content: string, context: ParseContext): Arrow | null {
  // Bidirectional: [^id1] <-label-> [^id2]
  const bidirectionalMatch = content.match(/\[\^([\w-]+)\]\s*<-([^-]*)->\s*\[\^([\w-]+)\]/)
  if (bidirectionalMatch) {
    const fromRefId = bidirectionalMatch[1]
    const label = bidirectionalMatch[2].trim()
    const toRefId = bidirectionalMatch[3]

    return {
      id: generateUUID(),
      label,
      from: context.nodeIdMap.get(fromRefId) || fromRefId,
      to: context.nodeIdMap.get(toRefId) || toRefId,
      bidirectional: true,
    } as Arrow
  }

  // Forward: [^id1] >-label-> [^id2]
  const forwardMatch = content.match(/\[\^([\w-]+)\]\s*>-([^-]*)->\s*\[\^([\w-]+)\]/)
  if (forwardMatch) {
    const fromRefId = forwardMatch[1]
    const label = forwardMatch[2].trim()
    const toRefId = forwardMatch[3]

    return {
      id: generateUUID(),
      label,
      from: context.nodeIdMap.get(fromRefId) || fromRefId,
      to: context.nodeIdMap.get(toRefId) || toRefId,
    } as Arrow
  }

  return null
}

function parseSummary(content: string, siblings: NodeObj[], parentId: string): Summary | null {
  // Format: :2 label or just label
  const countMatch = content.match(/^:(\d+)\s+(.*)/)

  let count: number
  let label: string

  if (countMatch) {
    count = parseInt(countMatch[1], 10)
    label = countMatch[2]
  } else {
    count = siblings.length
    label = content.trim()
  }

  if (siblings.length === 0 || count === 0) {
    return null
  }

  const nodesToSummarize = siblings.slice(-count)
  const start = siblings.indexOf(nodesToSummarize[0])
  const end = siblings.indexOf(nodesToSummarize[nodesToSummarize.length - 1])

  return {
    id: generateUUID(),
    label,
    parent: parentId,
    start,
    end,
  }
}
