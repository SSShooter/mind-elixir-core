import type { MindElixirData, NodeObj } from '../types'
import type { Arrow } from '../arrow'
import type { Summary } from '../summary'

interface ParseContext {
  arrowLines: { content: string; parentChildren: NodeObj[] }[]
  summaryLines: { content: string; parentChildren: NodeObj[]; parentId: string }[]
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
    - Child Node 2-1 [^id1]
    - Child Node 2-2 [^id2]
    - Child Node 2-3
    - > [^id1] <-Bidirectional Link-> [^id2]
  - Child Node 3
    - Child Node 3-1 [^id3]
    - Child Node 3-2 [^id4]
    - Child Node 3-3 [^id5] {"fontFamily": "Arial", "fontWeight": "bold"}
    - > [^id3] >-Unidirectional Link-> [^id4]
    - > [^id3] <-Unidirectional Link-< [^id5]
  - Child Node 4
    - Child Node 4-1 [^id6]
    - Child Node 4-2 [^id7]
    - Child Node 4-3 [^id8]
    - } Summary of all previous nodes
    - Child Node 4-4
  - > [^id1] <-Link position is not restricted, as long as the id can be found during rendering-> [^id8]
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
 * @param plaintext - The plaintext string to convert
 * @returns MindElixirData object
 */
export function plaintextToMindElixir(plaintext: string): MindElixirData {
  const lines = plaintext.split('\n').filter(line => line.trim())

  const context: ParseContext = {
    arrowLines: [],
    summaryLines: [],
    nodeIdMap: new Map(),
  }

  // First pass: parse nodes and collect arrows/summaries for later processing
  const root = parseNode(lines, 0, -2, context)

  if (!root.node) {
    throw new Error('Failed to parse plaintext: no root node found')
  }

  // Second pass: process arrows and summaries
  const arrows = context.arrowLines.map(({ content }) => parseArrow(content, context)).filter((a): a is Arrow => a !== null)

  const summaries = context.summaryLines
    .map(({ content, parentChildren, parentId }) => parseSummary(content, parentChildren, parentId))
    .filter((s): s is Summary => s !== null)

  return {
    nodeData: root.node,
    arrows: arrows.length > 0 ? arrows : undefined,
    summaries: summaries.length > 0 ? summaries : undefined,
  }
}

interface ParseResult {
  node: NodeObj | null
  nextIndex: number
}

function parseNode(lines: string[], index: number, parentIndent: number, context: ParseContext): ParseResult {
  if (index >= lines.length) {
    return { node: null, nextIndex: index }
  }

  const line = lines[index]
  const indent = getIndent(line)

  if (indent <= parentIndent) {
    return { node: null, nextIndex: index }
  }

  const parsed = parseLine(line)

  // If this line is an arrow or summary at the current level, we need to handle it
  // Note: We should only skip arrows/summaries when parsing a child recursively
  // But when encountered directly, collect them and skip creating a node
  if (parsed.type === 'arrow' || parsed.type === 'summary') {
    // We can't add to context here because we don't have the parent's children yet
    // Just skip and let the parent handle it
    return { node: null, nextIndex: index + 1 }
  }

  // Create the node
  const nodeId = generateId()
  const node: NodeObj = {
    topic: parsed.topic,
    id: nodeId,
  }

  if (parsed.style) {
    node.style = parsed.style
  }

  if (parsed.refId) {
    context.nodeIdMap.set(parsed.refId, nodeId)
  }

  // Parse children
  const children: NodeObj[] = []
  let currentIndex = index + 1

  while (currentIndex < lines.length) {
    const childLine = lines[currentIndex]
    const childIndent = getIndent(childLine)

    // Not a child
    if (childIndent <= indent) {
      break
    }

    // Direct child only
    if (childIndent === indent + 2) {
      const childParsed = parseLine(childLine)

      if (childParsed.type === 'arrow') {
        context.arrowLines.push({
          content: childParsed.content,
          parentChildren: children,
        })
        currentIndex++
      } else if (childParsed.type === 'summary') {
        context.summaryLines.push({
          content: childParsed.content,
          parentChildren: children,
          parentId: nodeId, // Pass parent node ID
        })
        currentIndex++
      } else {
        const result = parseNode(lines, currentIndex, indent, context)
        if (result.node) {
          children.push(result.node)
        }
        currentIndex = result.nextIndex
      }
    } else {
      // Skip deeper indented lines (will be handled recursively)
      currentIndex++
    }
  }

  if (children.length > 0) {
    node.children = children
  }

  return { node, nextIndex: currentIndex }
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
  const refMatch = nodeContent.match(/\[\^(\w+)\]/)
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
  const bidirectionalMatch = content.match(/\[\^(\w+)\]\s*<-([^-]*)->\s*\[\^(\w+)\]/)
  if (bidirectionalMatch) {
    const fromRefId = bidirectionalMatch[1]
    const label = bidirectionalMatch[2].trim()
    const toRefId = bidirectionalMatch[3]

    return {
      id: generateId(),
      label,
      from: context.nodeIdMap.get(fromRefId) || fromRefId,
      to: context.nodeIdMap.get(toRefId) || toRefId,
      bidirectional: true,
    } as Arrow
  }

  // Forward: [^id1] >-label-> [^id2]
  const forwardMatch = content.match(/\[\^(\w+)\]\s*>-([^-]*)->\s*\[\^(\w+)\]/)
  if (forwardMatch) {
    const fromRefId = forwardMatch[1]
    const label = forwardMatch[2].trim()
    const toRefId = forwardMatch[3]

    return {
      id: generateId(),
      label,
      from: context.nodeIdMap.get(fromRefId) || fromRefId,
      to: context.nodeIdMap.get(toRefId) || toRefId,
    } as Arrow
  }

  // Backward: [^id1] <-label-< [^id2]
  const backwardMatch = content.match(/\[\^(\w+)\]\s*<-([^-]*)-<\s*\[\^(\w+)\]/)
  if (backwardMatch) {
    const fromRefId = backwardMatch[3]
    const label = backwardMatch[2].trim()
    const toRefId = backwardMatch[1]

    return {
      id: generateId(),
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
    id: generateId(),
    label,
    parent: parentId,
    start,
    end,
  }
}

let idCounter = 0
function generateId(): string {
  return `node-${Date.now()}-${idCounter++}`
}
