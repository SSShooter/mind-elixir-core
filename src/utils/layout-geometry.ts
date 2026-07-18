/**
 * DOM-free geometry layout for Mind Elixir.
 *
 * Pipeline: measure (text → box) → layout (tree → absolute rects) → links (reuse branch math)
 * Render separately via `renderGeometrySvg`.
 *
 * Visual intent mirrors index.less (flex + inline-block), but uses absolute coordinates
 * so Node.js can produce SVG/PNG without a browser.
 */
import type { Arrow, ArrowStyle } from '../arrow'
import { LEFT, RIGHT, SIDE, THEME, DARK_THEME } from '../const'
import type { Summary } from '../summary'
import { DirectionClass, type NodeObj, type Theme, type ThemeCssVar } from '../types/index'
import { main as mainBranch, subPath, type MainLineParams, type SubLineParams } from './generateBranch'
import { getArrowPoints } from './index'
import { layoutSummaryBracket } from './summaryLayout'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeRole = 'root' | 'main' | 'sub'

export interface GeometryRect {
  x: number
  y: number
  width: number
  height: number
}

export interface GeometryTag {
  text: string
  style?: Record<string, string>
  className?: string
}

export interface GeometryNode {
  id: string
  topic: string
  role: NodeRole
  direction: DirectionClass
  /** Absolute rect of the topic box (me-tpc) */
  rect: GeometryRect
  /**
   * Absolute rect of the whole me-wrapper (topic + descendants).
   * Same role as DOM me-wrapper for summary bounds.
   */
  wrapperRect: GeometryRect
  /** Lines after wrapping, for SVG text rendering */
  lines: string[]
  fontSize: number
  fontWeight: string
  fontFamily: string
  color: string
  background: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  padding: { top: number; right: number; bottom: number; left: number }
  branchColor?: string
  tags?: GeometryTag[]
  icons?: string[]
  hyperLink?: string
  image?: {
    url: string
    width: number
    height: number
    fit?: 'fill' | 'contain' | 'cover'
  }
  children: GeometryNode[]
}

export interface GeometryLink {
  d: string
  color: string
  width: number
  /** main = root→main, sub = parent→child inside a branch */
  kind: 'main' | 'sub'
}

/** Custom connection between two nodes (topiclinks / arrows) */
export interface GeometryArrow {
  id: string
  /** Cubic bezier path for the main stroke */
  d: string
  /** Arrow head at `to` end */
  headD: string
  /** Optional arrow head at `from` end (bidirectional) */
  tailD?: string
  label: string
  labelX: number
  labelY: number
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  strokeLinecap?: string
  opacity?: number
  labelColor: string
}

/** Bracket + label summarizing a sibling range (from layoutSummaryBracket) */
export interface GeometrySummary {
  id: string
  d: string
  label: string
  labelX: number
  labelY: number
  /** Matches createLabel anchor */
  anchor: 'start' | 'end'
  stroke: string
  labelColor: string
  /** Estimated label box for foreignObject / canvas expansion */
  labelWidth: number
  labelHeight: number
}

export interface GeometryResult {
  width: number
  height: number
  root: GeometryNode
  leftMains: GeometryNode[]
  rightMains: GeometryNode[]
  links: GeometryLink[]
  arrows: GeometryArrow[]
  summaries: GeometrySummary[]
  theme: Theme & { cssVar: ThemeCssVar }
  /** Flat list of all nodes for convenient iteration */
  nodes: GeometryNode[]
}

export interface MeasureTextResult {
  width: number
  height: number
  lines: string[]
}

export interface MeasureTextOptions {
  text: string
  fontSize: number
  fontWeight: string
  fontFamily: string
  maxWidth: number
  lineHeight: number
}

/**
 * Optional external text measurer (e.g. skia-canvas / node-canvas measureText).
 * If omitted, a built-in CJK-aware approximation is used.
 */
export type MeasureTextFn = (options: MeasureTextOptions) => MeasureTextResult

export interface GeometryLayoutOptions {
  direction?: typeof LEFT | typeof RIGHT | typeof SIDE
  theme?: Theme
  compact?: boolean
  /**
   * Extra padding around the whole map (mirrors --map-padding).
   * Number = uniform; object for per-side.
   */
  padding?: number | { top: number; right: number; bottom: number; left: number }
  /** Override text measurement */
  measureText?: MeasureTextFn
  /** Default font family for topics */
  fontFamily?: string
  /**
   * Override me-tpc max-width in px (CSS default is `35em`, relative to each
   * topic's font-size). When omitted, each node uses `35 * fontSize`.
   * With border-box this is the **outer** box; content width subtracts padding+border.
   */
  maxTopicWidth?: number
  imageProxy?: (url: string) => string
  /** Custom arrows between nodes (same shape as MindElixirData.arrows) */
  arrows?: Arrow[]
  /** Summary brackets over sibling ranges (same shape as MindElixirData.summaries) */
  summaries?: Summary[]
}

// ---------------------------------------------------------------------------
// Theme / gap helpers
// ---------------------------------------------------------------------------

interface ResolvedGaps {
  nodeGapX: number
  nodeGapY: number
  mainGapX: number
  mainGapY: number
  topicPadding: number
  mapPadding: { top: number; right: number; bottom: number; left: number }
  rootRadius: number
  mainRadius: number
}

function px(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

function parseMapPadding(value: string | undefined): ResolvedGaps['mapPadding'] {
  // CSS: "50px 80px" → top/bottom 50, left/right 80
  if (!value) return { top: 50, right: 80, bottom: 50, left: 80 }
  const parts = value.trim().split(/\s+/).map(p => px(p, 0))
  if (parts.length === 1) {
    const v = parts[0]
    return { top: v, right: v, bottom: v, left: v }
  }
  if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
  }
  if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] }
  }
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
}

function resolveTheme(theme?: Theme, compact?: boolean): Theme & { cssVar: ThemeCssVar } {
  const base = theme?.type === 'dark' ? DARK_THEME : THEME
  const cssVar: ThemeCssVar = {
    ...base.cssVar,
    ...(theme?.cssVar || {}),
  }
  if (compact) {
    cssVar['--node-gap-x'] = '15px'
    cssVar['--node-gap-y'] = '2px'
    cssVar['--main-gap-x'] = '30px'
    cssVar['--main-gap-y'] = '6px'
  }
  return {
    name: theme?.name || base.name,
    type: theme?.type || base.type,
    palette: theme?.palette || base.palette,
    cssVar,
    generateMainBranch: theme?.generateMainBranch,
    generateSubBranch: theme?.generateSubBranch,
  }
}

function resolveGaps(cssVar: ThemeCssVar, paddingOpt?: GeometryLayoutOptions['padding']): ResolvedGaps {
  let mapPadding = parseMapPadding(cssVar['--map-padding'])
  if (typeof paddingOpt === 'number') {
    mapPadding = { top: paddingOpt, right: paddingOpt, bottom: paddingOpt, left: paddingOpt }
  } else if (paddingOpt) {
    mapPadding = { ...mapPadding, ...paddingOpt }
  }
  return {
    nodeGapX: px(cssVar['--node-gap-x'], 30),
    nodeGapY: px(cssVar['--node-gap-y'], 10),
    mainGapX: px(cssVar['--main-gap-x'], 65),
    mainGapY: px(cssVar['--main-gap-y'], 45),
    topicPadding: px(cssVar['--topic-padding'], 3),
    mapPadding,
    rootRadius: px(cssVar['--root-radius'], 30),
    mainRadius: px(cssVar['--main-radius'], 20),
  }
}

// ---------------------------------------------------------------------------
// Text measurement (no DOM)
// ---------------------------------------------------------------------------

/**
 * Built-in approximate text metrics.
 * CJK full-width ≈ fontSize; Latin/digit ≈ 0.55×fontSize; emoji ≈ fontSize.
 * Good enough for server previews; inject measureText for pixel-accurate output.
 */
export function approximateMeasureText(options: MeasureTextOptions): MeasureTextResult {
  const { text, fontSize, fontWeight, maxWidth, lineHeight } = options
  const weightFactor = fontWeight === 'bold' || parseInt(fontWeight, 10) >= 600 ? 1.06 : 1
  const charWidth = (ch: string): number => {
    const code = ch.codePointAt(0) ?? 0
    // CJK Unified Ideographs + common fullwidth ranges
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x3000 && code <= 0x303f) ||
      (code >= 0xff00 && code <= 0xffef) ||
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0xac00 && code <= 0xd7af)
    ) {
      return fontSize * weightFactor
    }
    // emoji / symbols rough
    if (code > 0xffff || (code >= 0x1f300 && code <= 0x1faff)) {
      return fontSize * weightFactor
    }
    if (ch === ' ' || ch === '\t') return fontSize * 0.33 * weightFactor
    // narrow latin
    if (/[iIljJtfr]/.test(ch)) return fontSize * 0.32 * weightFactor
    if (/[mwMW]/.test(ch)) return fontSize * 0.75 * weightFactor
    return fontSize * 0.55 * weightFactor
  }

  const paragraphs = text.split('\n')
  const lines: string[] = []

  for (const para of paragraphs) {
    if (para === '') {
      lines.push('')
      continue
    }
    let current = ''
    let currentW = 0
    for (const ch of para) {
      const w = charWidth(ch)
      if (currentW + w > maxWidth && current.length > 0) {
        lines.push(current)
        current = ch
        currentW = w
      } else {
        current += ch
        currentW += w
      }
    }
    if (current.length > 0 || para === '') lines.push(current)
  }

  if (lines.length === 0) lines.push('')

  let maxLineW = 0
  for (const line of lines) {
    let w = 0
    for (const ch of line) w += charWidth(ch)
    if (w > maxLineW) maxLineW = w
  }

  const height = Math.max(lineHeight, lines.length * lineHeight)
  return {
    width: Math.min(Math.ceil(maxLineW), maxWidth) || fontSize * 0.5,
    height: Math.ceil(height),
    lines,
  }
}

// ---------------------------------------------------------------------------
// Role-specific topic box styles (mirrors index.less)
// ---------------------------------------------------------------------------

interface TopicStyle {
  fontSize: number
  fontWeight: string
  fontFamily: string
  color: string
  background: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  padding: { top: number; right: number; bottom: number; left: number }
  maxContentWidth: number
}

/**
 * CSS me-tpc: max-width 35em + box-sizing border-box.
 * Outer max is em-based (or an absolute override); content max excludes padding/border.
 */
function resolveMaxContentWidth(
  fontSize: number,
  padding: { left: number; right: number },
  borderWidth: number,
  maxTopicWidthOverride?: number
): number {
  const maxOuter = maxTopicWidthOverride ?? fontSize * 35
  const chrome = padding.left + padding.right + borderWidth * 2
  return Math.max(fontSize, maxOuter - chrome)
}

function topicStyleFor(
  role: NodeRole,
  node: NodeObj,
  theme: Theme & { cssVar: ThemeCssVar },
  gaps: ResolvedGaps,
  fontFamily: string,
  maxTopicWidth?: number
): TopicStyle {
  const cv = theme.cssVar
  let fontSize = 16
  let fontWeight = 'normal'
  let color = cv['--color']
  let background = 'transparent'
  let borderColor = 'transparent'
  let borderWidth = 0
  let borderRadius = 3
  let padding = {
    top: gaps.topicPadding,
    right: gaps.topicPadding,
    bottom: gaps.topicPadding,
    left: gaps.topicPadding,
  }

  if (role === 'root') {
    fontSize = 25
    color = cv['--root-color']
    background = cv['--root-bgcolor']
    borderColor = cv['--root-border-color'] || 'transparent'
    borderWidth = 2
    borderRadius = gaps.rootRadius
    padding = { top: 10, right: 30, bottom: 10, left: 30 }
  } else if (role === 'main') {
    color = cv['--main-color']
    background = cv['--main-bgcolor']
    borderColor = cv['--main-color']
    borderWidth = 2
    borderRadius = gaps.mainRadius
    padding = { top: 8, right: 25, bottom: 8, left: 25 }
    // main-border can override
    if (cv['--main-border']) {
      // e.g. "2px solid #xxx" — keep simple defaults if unparsable
      borderWidth = 2
    }
  }

  // Node-level style overrides
  if (node.style) {
    if (node.style.fontSize) fontSize = px(node.style.fontSize, fontSize)
    if (node.style.fontWeight) fontWeight = node.style.fontWeight
    if (node.style.fontFamily) fontFamily = node.style.fontFamily
    if (node.style.color) color = node.style.color
    if (node.style.background) background = node.style.background
  }

  return {
    fontSize,
    fontWeight,
    fontFamily,
    color,
    background,
    borderColor,
    borderWidth,
    borderRadius,
    padding,
    maxContentWidth: resolveMaxContentWidth(fontSize, padding, borderWidth, maxTopicWidth),
  }
}

// ---------------------------------------------------------------------------
// Measure one topic box
// ---------------------------------------------------------------------------

interface MeasuredTopic {
  width: number
  height: number
  lines: string[]
  style: TopicStyle
  tags?: GeometryTag[]
  icons?: string[]
  hyperLink?: string
  image?: GeometryNode['image']
}

const TAG_FONT = 12
const TAG_PAD_X = 4
const TAG_PAD_Y = 2
const TAG_GAP = 4
const TAG_MARGIN_TOP = 2
const ICON_SIZE = 16
const IMAGE_MARGIN_BOTTOM = 8
const HYPERLINK_W = 18

function measureTopic(
  node: NodeObj,
  role: NodeRole,
  theme: Theme & { cssVar: ThemeCssVar },
  gaps: ResolvedGaps,
  opts: Required<Pick<GeometryLayoutOptions, 'fontFamily'>> & {
    maxTopicWidth?: number
    measureText: MeasureTextFn
    imageProxy?: (url: string) => string
  }
): MeasuredTopic {
  const style = topicStyleFor(role, node, theme, gaps, opts.fontFamily, opts.maxTopicWidth)
  const contentMax = style.maxContentWidth

  // Hyperlink sits inline inside me-tpc (border-box max-width), reserve its slot for wrap
  const hasLink = Boolean(node.hyperLink)
  const textMax = hasLink ? Math.max(style.fontSize, contentMax - HYPERLINK_W) : contentMax

  // dangerouslySetInnerHTML: fall back to plain topic text (no HTML layout)
  const topicText = node.dangerouslySetInnerHTML
    ? stripHtml(node.dangerouslySetInnerHTML) || node.topic
    : node.topic

  const lineHeight = style.fontSize * 1.4
  const textMetrics = opts.measureText({
    text: topicText || ' ',
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    maxWidth: textMax,
    lineHeight,
  })

  let contentW = textMetrics.width
  let contentH = textMetrics.height

  // Image above text (block)
  let image: GeometryNode['image'] | undefined
  if (node.image?.url && node.image.width && node.image.height) {
    const url = opts.imageProxy ? opts.imageProxy(node.image.url) : node.image.url
    image = {
      url,
      width: node.image.width,
      height: node.image.height,
      fit: node.image.fit,
    }
    contentW = Math.max(contentW, Math.min(node.image.width, contentMax))
    contentH += node.image.height + IMAGE_MARGIN_BOTTOM
  }

  // Tags row
  let tags: GeometryTag[] | undefined
  if (node.tags && node.tags.length > 0) {
    tags = node.tags.map(t =>
      typeof t === 'string'
        ? { text: t }
        : { text: t.text, style: t.style as Record<string, string> | undefined, className: t.className }
    )
    let tagsW = 0
    const tagH = TAG_FONT * 1.3 + TAG_PAD_Y * 2
    tags.forEach((tag, i) => {
      // approximate tag width
      const tw =
        [...tag.text].reduce((s, ch) => {
          const code = ch.codePointAt(0) ?? 0
          return s + (code > 0xff ? TAG_FONT : TAG_FONT * 0.55)
        }, 0) +
        TAG_PAD_X * 2
      tagsW += tw + (i > 0 ? TAG_GAP : 0)
    })
    contentW = Math.max(contentW, Math.min(tagsW, contentMax))
    contentH += TAG_MARGIN_TOP + tagH
  }

  // Icons
  let icons: string[] | undefined
  if (node.icons && node.icons.length > 0) {
    icons = node.icons
    contentW = Math.max(contentW, Math.min(node.icons.length * (ICON_SIZE + 2), contentMax))
    contentH += ICON_SIZE + 2
  }

  // Hyperlink indicator
  let hyperLink: string | undefined
  if (hasLink) {
    hyperLink = node.hyperLink
    contentW = Math.min(contentMax, contentW + HYPERLINK_W)
  }

  // Cap content to me-tpc border-box max (35em outer − padding − border)
  contentW = Math.min(contentW, contentMax)

  const width =
    Math.ceil(contentW + style.padding.left + style.padding.right + style.borderWidth * 2)
  const height =
    Math.ceil(contentH + style.padding.top + style.padding.bottom + style.borderWidth * 2)

  return {
    width: Math.max(width, style.fontSize + style.padding.left + style.padding.right),
    height: Math.max(height, style.fontSize + style.padding.top + style.padding.bottom),
    lines: textMetrics.lines,
    style,
    tags,
    icons,
    hyperLink,
    image,
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

// ---------------------------------------------------------------------------
// Recursive subtree layout (absolute coords relative to subtree origin)
// ---------------------------------------------------------------------------

interface SubtreeLayout {
  /** Entire subtree bounding box size */
  width: number
  height: number
  node: GeometryNode
}

function layoutSubtree(
  node: NodeObj,
  role: NodeRole,
  direction: DirectionClass,
  theme: Theme & { cssVar: ThemeCssVar },
  gaps: ResolvedGaps,
  measureOpts: Parameters<typeof measureTopic>[4],
  branchColor: string | undefined
): SubtreeLayout {
  const measured = measureTopic(node, role, theme, gaps, measureOpts)
  const color = node.branchColor || branchColor

  const childNodes =
    node.expanded !== false && node.children && node.children.length > 0 ? node.children : []

  const childLayouts: SubtreeLayout[] = childNodes.map(child =>
    layoutSubtree(child, 'sub', direction, theme, gaps, measureOpts, color)
  )

  const topicW = measured.width
  const topicH = measured.height

  // Vertical stack of children with nodeGapY between sibling wrappers
  // (CSS: me-parent margin-top: node-gap-y; approximate as gap between siblings)
  let childrenBlockH = 0
  let childrenBlockW = 0
  if (childLayouts.length > 0) {
    childrenBlockH =
      childLayouts.reduce((s, c) => s + c.height, 0) + gaps.nodeGapY * (childLayouts.length - 1)
    childrenBlockW = Math.max(...childLayouts.map(c => c.width))
  }

  // Horizontal: parent | gap | children  (mirrored for LHS)
  // CSS: me-parent padding-x = node-gap-x on each side → ~2×gap between sibling topic boxes
  const hGap = childLayouts.length > 0 ? gaps.nodeGapX * 2 : 0
  const totalH = Math.max(topicH, childrenBlockH)
  const totalW = topicW + hGap + (childLayouts.length > 0 ? childrenBlockW : 0)

  // Topic vertically centered against children block
  const topicY = (totalH - topicH) / 2
  let topicX: number
  let childrenOriginX: number

  if (direction === DirectionClass.LHS) {
    // children on the left, topic on the right
    childrenOriginX = 0
    topicX = childrenBlockW + hGap
  } else {
    topicX = 0
    childrenOriginX = topicW + hGap
  }

  const geoChildren: GeometryNode[] = []
  let cy = (totalH - childrenBlockH) / 2

  for (const cl of childLayouts) {
    // RHS: left-align subtrees (topics near parent, expand right)
    // LHS: right-align subtrees (topics near parent, expand left) — matches .lhs { direction: rtl }
    // Without right-align, leaves get pushed to the deepest column and underlines stretch too far.
    const childX =
      direction === DirectionClass.LHS
        ? childrenOriginX + (childrenBlockW - cl.width)
        : childrenOriginX
    offsetNode(cl.node, childX, cy)
    geoChildren.push(cl.node)
    cy += cl.height + gaps.nodeGapY
  }

  // Browser linkDiv paints main-node border with branchColor
  const borderColor =
    role === 'main' && color ? color : measured.style.borderColor

  // me-wrapper ≈ me-parent(+padding) + me-children. Sub me-parent has padding 6px / node-gap-x.
  let wrapperRect: GeometryRect
  if (role === 'sub' && childLayouts.length === 0) {
    // Leaf: wrapper is just padded parent around the topic
    wrapperRect = {
      x: topicX - gaps.nodeGapX,
      y: topicY - 6,
      width: topicW + gaps.nodeGapX * 2,
      height: topicH + 12,
    }
  } else if (role === 'sub') {
    // Branch: include vertical parent padding in wrapper height
    wrapperRect = {
      x: 0,
      y: 0,
      width: totalW,
      height: Math.max(totalH, topicH + 12),
    }
  } else {
    wrapperRect = { x: 0, y: 0, width: totalW, height: totalH }
  }

  const geo: GeometryNode = {
    id: node.id,
    topic: node.topic,
    role,
    direction,
    rect: { x: topicX, y: topicY, width: topicW, height: topicH },
    // Local me-wrapper; shifted later by offsetNode (matches DOM me-wrapper)
    wrapperRect,
    lines: measured.lines,
    fontSize: measured.style.fontSize,
    fontWeight: measured.style.fontWeight,
    fontFamily: measured.style.fontFamily,
    color: measured.style.color,
    background: measured.style.background,
    borderColor,
    borderWidth: measured.style.borderWidth,
    borderRadius: measured.style.borderRadius,
    padding: measured.style.padding,
    branchColor: color,
    tags: measured.tags,
    icons: measured.icons,
    hyperLink: measured.hyperLink,
    image: measured.image,
    children: geoChildren,
  }

  return { width: totalW, height: totalH, node: geo }
}

function offsetNode(node: GeometryNode, dx: number, dy: number): void {
  node.rect.x += dx
  node.rect.y += dy
  node.wrapperRect.x += dx
  node.wrapperRect.y += dy
  for (const c of node.children) offsetNode(c, dx, dy)
}

// ---------------------------------------------------------------------------
// Top-level: distribute main nodes L/R, place root, emit links
// ---------------------------------------------------------------------------

function distributeMainNodes(
  mainNodes: NodeObj[],
  direction: number
): { left: NodeObj[]; right: NodeObj[] } {
  const left: NodeObj[] = []
  const right: NodeObj[] = []

  if (direction === SIDE) {
    let lcount = 0
    let rcount = 0
    for (const node of mainNodes) {
      if (node.direction === LEFT) {
        left.push(node)
        lcount++
      } else if (node.direction === RIGHT) {
        right.push(node)
        rcount++
      } else if (lcount <= rcount) {
        left.push(node)
        lcount++
      } else {
        right.push(node)
        rcount++
      }
    }
  } else if (direction === LEFT) {
    left.push(...mainNodes)
  } else {
    right.push(...mainNodes)
  }
  return { left, right }
}

function flattenNodes(node: GeometryNode, out: GeometryNode[]): void {
  out.push(node)
  for (const c of node.children) flattenNodes(c, out)
}

/**
 * Browser linkDiv measures me-parent, not me-tpc.
 * me-parent padding: 6px var(--node-gap-x) for sub nodes; main parent has padding: 0.
 * Expanding topic rects here makes subPath H-end land under the full label.
 */
function topicToParentBox(node: GeometryNode, gaps: ResolvedGaps): GeometryRect {
  const r = node.rect
  if (node.role === 'main' || node.role === 'root') {
    // me-main > me-parent { padding: 0 } / me-root — same outer size as topic
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  }
  const padX = gaps.nodeGapX
  const padY = 6
  return {
    x: r.x - padX,
    y: r.y - padY,
    width: r.width + padX * 2,
    height: r.height + padY * 2,
  }
}

function collectSubLinks(
  parent: GeometryNode,
  gap: number,
  gaps: ResolvedGaps,
  links: GeometryLink[]
): void {
  const kids = parent.children
  if (!kids.length) return

  // Browser linkDiv: isFirst=true only for edges from a main node
  const isFirst = parent.role === 'main'
  const p = topicToParentBox(parent, gaps)
  for (const child of kids) {
    const c = topicToParentBox(child, gaps)
    const params: SubLineParams = {
      pT: p.y,
      pL: p.x,
      pW: p.width,
      pH: p.height,
      cT: c.y,
      cL: c.x,
      cW: c.width,
      cH: c.height,
      direction: parent.direction,
      isFirst,
    }
    links.push({
      d: subPath(params, gap),
      color: child.branchColor || parent.branchColor || '#666',
      width: 2,
      kind: 'sub',
    })
    collectSubLinks(child, gap, gaps, links)
  }
}

// ---------------------------------------------------------------------------
// Arrows (topiclinks) — pure port of arrow.ts calc helpers
// ---------------------------------------------------------------------------

interface CtrlData {
  w: number
  h: number
  cx: number
  cy: number
  ctrlX: number
  ctrlY: number
}

function calcCtrlFromRect(rect: GeometryRect, delta: { x: number; y: number }): CtrlData {
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  return {
    w: rect.width,
    h: rect.height,
    cx,
    cy,
    ctrlX: cx + delta.x,
    ctrlY: cy + delta.y,
  }
}

/** Intersection of center→control ray with the topic rect edge */
function calcEdgePoint(data: CtrlData): { x: number; y: number } {
  let x: number
  let y: number
  const k = (data.cy - data.ctrlY) / (data.ctrlX - data.cx)
  if (k > data.h / data.w || k < -data.h / data.w) {
    if (data.cy - data.ctrlY < 0) {
      x = data.cx - data.h / 2 / k
      y = data.cy + data.h / 2
    } else {
      x = data.cx + data.h / 2 / k
      y = data.cy - data.h / 2
    }
  } else {
    if (data.cx - data.ctrlX < 0) {
      x = data.cx + data.w / 2
      y = data.cy - (data.w * k) / 2
    } else {
      x = data.cx - data.w / 2
      y = data.cy + (data.w * k) / 2
    }
  }
  return { x, y }
}

function calcBezierMidPoint(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  p4x: number,
  p4y: number
) {
  return {
    x: p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8,
    y: p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8,
  }
}

function defaultArrowDeltas(from: GeometryNode, to: GeometryNode): {
  delta1: { x: number; y: number }
  delta2: { x: number; y: number }
} {
  const fromCenterX = from.rect.x + from.rect.width / 2
  const fromCenterY = from.rect.y + from.rect.height / 2
  const toCenterX = to.rect.x + to.rect.width / 2
  const toCenterY = to.rect.y + to.rect.height / 2
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY
  const distance = Math.sqrt(dx * dx + dy * dy)
  const baseOffset = Math.max(50, Math.min(200, distance * 0.3))
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (distance < 150) {
    const xMul = from.direction === DirectionClass.LHS ? -1 : 1
    return {
      delta1: { x: 200 * xMul, y: 0 },
      delta2: { x: 200 * xMul, y: 0 },
    }
  }
  if (absDx > absDy * 1.5) {
    const fromEdgeOffsetX = dx > 0 ? from.rect.width / 2 : -from.rect.width / 2
    const toEdgeOffsetX = dx > 0 ? -to.rect.width / 2 : to.rect.width / 2
    return {
      delta1: { x: fromEdgeOffsetX + (dx > 0 ? baseOffset : -baseOffset), y: 0 },
      delta2: { x: toEdgeOffsetX + (dx > 0 ? -baseOffset : baseOffset), y: 0 },
    }
  }
  if (absDy > absDx * 1.5) {
    const fromEdgeOffsetY = dy > 0 ? from.rect.height / 2 : -from.rect.height / 2
    const toEdgeOffsetY = dy > 0 ? -to.rect.height / 2 : to.rect.height / 2
    return {
      delta1: { x: 0, y: fromEdgeOffsetY + (dy > 0 ? baseOffset : -baseOffset) },
      delta2: { x: 0, y: toEdgeOffsetY + (dy > 0 ? -baseOffset : baseOffset) },
    }
  }
  const angle = Math.atan2(dy, dx)
  const fromEdgeOffsetX = (from.rect.width / 2) * Math.cos(angle)
  const fromEdgeOffsetY = (from.rect.height / 2) * Math.sin(angle)
  const toEdgeOffsetX = -(to.rect.width / 2) * Math.cos(angle)
  const toEdgeOffsetY = -(to.rect.height / 2) * Math.sin(angle)
  const offsetX = baseOffset * 0.7 * (dx > 0 ? 1 : -1)
  const offsetY = baseOffset * 0.7 * (dy > 0 ? 1 : -1)
  return {
    delta1: {
      x: Math.round(fromEdgeOffsetX + offsetX),
      y: Math.round(fromEdgeOffsetY + offsetY),
    },
    delta2: {
      x: Math.round(toEdgeOffsetX - offsetX),
      y: Math.round(toEdgeOffsetY - offsetY),
    },
  }
}

function layoutArrows(
  arrows: Arrow[] | undefined,
  nodeMap: Map<string, GeometryNode>
): GeometryArrow[] {
  if (!arrows?.length) return []
  const out: GeometryArrow[] = []

  for (const arrow of arrows) {
    const from = nodeMap.get(arrow.from)
    const to = nodeMap.get(arrow.to)
    if (!from || !to) continue

    const deltas =
      arrow.delta1 && arrow.delta2
        ? { delta1: arrow.delta1, delta2: arrow.delta2 }
        : defaultArrowDeltas(from, to)

    const fromData = calcCtrlFromRect(from.rect, deltas.delta1)
    const toData = calcCtrlFromRect(to.rect, deltas.delta2)
    const { x: p1x, y: p1y } = calcEdgePoint(fromData)
    const p2x = fromData.ctrlX
    const p2y = fromData.ctrlY
    const p3x = toData.ctrlX
    const p3y = toData.ctrlY
    const { x: p4x, y: p4y } = calcEdgePoint(toData)

    const arrowT = getArrowPoints(p3x, p3y, p4x, p4y)
    if (!arrowT) continue

    const headD = `M ${arrowT.x1} ${arrowT.y1} L ${p4x} ${p4y} L ${arrowT.x2} ${arrowT.y2}`
    let tailD: string | undefined
    if (arrow.bidirectional) {
      const arrowF = getArrowPoints(p2x, p2y, p1x, p1y)
      if (arrowF) {
        tailD = `M ${arrowF.x1} ${arrowF.y1} L ${p1x} ${p1y} L ${arrowF.x2} ${arrowF.y2}`
      }
    }

    const mid = calcBezierMidPoint(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y)
    const style: ArrowStyle = arrow.style || {}
    const opacity =
      style.opacity !== undefined && style.opacity !== null && style.opacity !== ''
        ? Number(style.opacity)
        : undefined

    out.push({
      id: arrow.id,
      d: `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`,
      headD,
      tailD,
      label: arrow.label || '',
      labelX: mid.x,
      labelY: mid.y,
      stroke: style.stroke || 'rgb(227, 125, 116)',
      strokeWidth: Number(style.strokeWidth ?? 2),
      strokeDasharray: style.strokeDasharray,
      strokeLinecap: style.strokeLinecap,
      opacity: Number.isFinite(opacity) ? opacity : undefined,
      labelColor: style.labelColor || 'rgb(235, 95, 82)',
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Summaries — reuse layoutSummaryBracket from summary.ts (same SVG as browser)
// ---------------------------------------------------------------------------

const SUMMARY_LABEL_MAX_WIDTH = 200

function layoutSummaries(
  summaries: Summary[] | undefined,
  nodeMap: Map<string, GeometryNode>,
  rootId: string,
  theme: Theme & { cssVar: ThemeCssVar },
  measureText: MeasureTextFn,
  fontFamily: string
): GeometrySummary[] {
  if (!summaries?.length) return []
  const out: GeometrySummary[] = []
  const defaultColor = theme.cssVar['--color'] || '#666'

  for (const summary of summaries) {
    const parent = nodeMap.get(summary.parent)
    if (!parent) continue
    const kids = parent.children
    if (!kids.length) continue

    const start = Math.max(0, summary.start)
    const end = Math.min(kids.length - 1, summary.end)
    if (start > end) continue

    const boxes = []
    for (let i = start; i <= end; i++) {
      const w = kids[i].wrapperRect
      boxes.push({ x: w.x, y: w.y, width: w.width, height: w.height })
    }

    const side = kids[start].direction
    const parentIsRoot = parent.id === rootId
    // Shared pure geometry with browser drawSummary
    const bracket = layoutSummaryBracket(boxes, side, parentIsRoot)

    const label = summary.label || ''
    const metrics = measureText({
      text: label,
      fontSize: 14,
      fontWeight: 'normal',
      fontFamily,
      maxWidth: SUMMARY_LABEL_MAX_WIDTH,
      lineHeight: 14 * 1.2,
    })

    out.push({
      id: summary.id,
      d: bracket.pathD,
      label,
      labelX: bracket.labelX,
      labelY: bracket.labelY,
      anchor: bracket.anchor,
      stroke: summary.style?.stroke || defaultColor,
      labelColor: summary.style?.labelColor || defaultColor,
      labelWidth: Math.min(SUMMARY_LABEL_MAX_WIDTH, Math.max(metrics.width, 40)),
      labelHeight: Math.max(metrics.height, 18),
    })
  }
  return out
}

/**
 * Compute full mind-map geometry from nodeData (no DOM).
 */
export function layoutGeometry(nodeData: NodeObj, options: GeometryLayoutOptions = {}): GeometryResult {
  const direction = options.direction ?? SIDE
  const theme = resolveTheme(options.theme, options.compact)
  const gaps = resolveGaps(theme.cssVar, options.padding)
  const fontFamily =
    options.fontFamily ||
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
  // undefined → per-node 35em (matches me-tpc max-width)
  const maxTopicWidth = options.maxTopicWidth
  const measureText = options.measureText ?? approximateMeasureText

  const measureOpts = {
    fontFamily,
    maxTopicWidth,
    measureText,
    imageProxy: options.imageProxy,
  }

  const mainNodes = nodeData.children || []
  const { left, right } = distributeMainNodes(mainNodes, direction)
  const palette = theme.palette

  // Palette index follows original main-node order (same as browser linkDiv)
  const mainIndex = new Map<string, number>()
  mainNodes.forEach((n, i) => mainIndex.set(n.id, i))

  const leftLayoutsFinal = left.map(n => {
    const i = mainIndex.get(n.id) ?? 0
    return layoutSubtree(
      n,
      'main',
      DirectionClass.LHS,
      theme,
      gaps,
      measureOpts,
      n.branchColor || palette[i % palette.length]
    )
  })
  const rightLayoutsFinal = right.map(n => {
    const i = mainIndex.get(n.id) ?? 0
    return layoutSubtree(
      n,
      'main',
      DirectionClass.RHS,
      theme,
      gaps,
      measureOpts,
      n.branchColor || palette[i % palette.length]
    )
  })

  // Column heights with mainGapY between main wrappers
  const stackHeight = (items: SubtreeLayout[]) => {
    if (!items.length) return 0
    return items.reduce((s, c) => s + c.height, 0) + gaps.mainGapY * (items.length - 1)
  }
  const stackWidth = (items: SubtreeLayout[]) =>
    items.length ? Math.max(...items.map(c => c.width)) : 0

  const leftH = stackHeight(leftLayoutsFinal)
  const rightH = stackHeight(rightLayoutsFinal)
  const leftW = stackWidth(leftLayoutsFinal)
  const rightW = stackWidth(rightLayoutsFinal)

  // Root
  const rootMeasured = measureTopic(nodeData, 'root', theme, gaps, measureOpts)
  const rootW = rootMeasured.width
  const rootH = rootMeasured.height

  // Horizontal structure: [left col][mainGapX][root][mainGapX][right col]
  // CSS: me-main wrappers have margin main-gap-x on both sides; approximate one gap between columns and root
  const gapL = leftLayoutsFinal.length ? gaps.mainGapX : 0
  const gapR = rightLayoutsFinal.length ? gaps.mainGapX : 0

  const contentW = leftW + gapL + rootW + gapR + rightW
  const contentH = Math.max(leftH, rootH, rightH)

  const pad = gaps.mapPadding
  const originX = pad.left
  const originY = pad.top

  // Place root centered vertically
  const rootX = originX + leftW + gapL
  const rootY = originY + (contentH - rootH) / 2

  const rootNode: GeometryNode = {
    id: nodeData.id,
    topic: nodeData.topic,
    role: 'root',
    direction: DirectionClass.RHS,
    rect: { x: rootX, y: rootY, width: rootW, height: rootH },
    wrapperRect: { x: rootX, y: rootY, width: rootW, height: rootH },
    lines: rootMeasured.lines,
    fontSize: rootMeasured.style.fontSize,
    fontWeight: rootMeasured.style.fontWeight,
    fontFamily: rootMeasured.style.fontFamily,
    color: rootMeasured.style.color,
    background: rootMeasured.style.background,
    borderColor: rootMeasured.style.borderColor,
    borderWidth: rootMeasured.style.borderWidth,
    borderRadius: rootMeasured.style.borderRadius,
    padding: rootMeasured.style.padding,
    tags: rootMeasured.tags,
    icons: rootMeasured.icons,
    hyperLink: rootMeasured.hyperLink,
    image: rootMeasured.image,
    children: [],
  }

  // Place left column (right-align subtrees toward root: each subtree's right edge near root)
  const leftMains: GeometryNode[] = []
  let ly = originY + (contentH - leftH) / 2
  for (const sl of leftLayoutsFinal) {
    // subtree local coords: topic is on the right side for LHS
    // Place so subtree occupies [originX + (leftW - sl.width), ...)
    const ox = originX + (leftW - sl.width)
    offsetNode(sl.node, ox, ly)
    leftMains.push(sl.node)
    ly += sl.height + gaps.mainGapY
  }

  // Place right column
  const rightMains: GeometryNode[] = []
  let ry = originY + (contentH - rightH) / 2
  const rightOriginX = originX + leftW + gapL + rootW + gapR
  for (const sl of rightLayoutsFinal) {
    offsetNode(sl.node, rightOriginX, ry)
    rightMains.push(sl.node)
    ry += sl.height + gaps.mainGapY
  }

  // Links
  const links: GeometryLink[] = []
  const containerHeight = contentH
  const allMains = [...leftMains, ...rightMains]

  for (const m of allMains) {
    const p = rootNode.rect
    const c = m.rect
    const params: MainLineParams = {
      pT: p.y,
      pL: p.x,
      pW: p.width,
      pH: p.height,
      cT: c.y,
      cL: c.x,
      cW: c.width,
      cH: c.height,
      direction: m.direction,
      containerHeight,
    }
    const d = mainBranch(params)
    links.push({
      d,
      color: m.branchColor || theme.palette[0],
      width: 3,
      kind: 'main',
    })
    collectSubLinks(m, gaps.nodeGapX, gaps, links)
  }

  const nodes: GeometryNode[] = []
  flattenNodes(rootNode, nodes)
  for (const m of leftMains) flattenNodes(m, nodes)
  for (const m of rightMains) flattenNodes(m, nodes)

  const nodeMap = new Map<string, GeometryNode>()
  for (const n of nodes) nodeMap.set(n.id, n)

  const geometryArrows = layoutArrows(options.arrows, nodeMap)
  const geometrySummaries = layoutSummaries(
    options.summaries,
    nodeMap,
    nodeData.id,
    theme,
    measureText,
    fontFamily
  )

  // Expand canvas if arrows / summary labels stick outside the node bounds
  let width = contentW + pad.left + pad.right
  let height = contentH + pad.top + pad.bottom
  let shiftX = 0
  let shiftY = 0

  {
    let minX = 0
    let minY = 0
    let maxX = width
    let maxY = height
    const expand = (x: number, y: number, margin = 24) => {
      minX = Math.min(minX, x - margin)
      minY = Math.min(minY, y - margin)
      maxX = Math.max(maxX, x + margin)
      maxY = Math.max(maxY, y + margin)
    }
    for (const a of geometryArrows) {
      expand(a.labelX, a.labelY, 40)
      // crude control-point coverage via path endpoints in d is enough for demos
    }
    for (const s of geometrySummaries) {
      // Label is anchored like createLabel (start = left edge, end = right edge, vertically centered)
      if (s.anchor === 'end') {
        expand(s.labelX - s.labelWidth, s.labelY - s.labelHeight / 2, 8)
        expand(s.labelX, s.labelY + s.labelHeight / 2, 8)
      } else {
        expand(s.labelX, s.labelY - s.labelHeight / 2, 8)
        expand(s.labelX + s.labelWidth, s.labelY + s.labelHeight / 2, 8)
      }
    }
    if (minX < 0 || minY < 0 || maxX > width || maxY > height) {
      shiftX = minX < 0 ? -minX : 0
      shiftY = minY < 0 ? -minY : 0
      width = maxX - minX
      height = maxY - minY
      if (shiftX || shiftY) {
        const shiftNode = (n: GeometryNode) => {
          n.rect.x += shiftX
          n.rect.y += shiftY
          n.wrapperRect.x += shiftX
          n.wrapperRect.y += shiftY
          n.children.forEach(shiftNode)
        }
        shiftNode(rootNode)
        leftMains.forEach(shiftNode)
        rightMains.forEach(shiftNode)
        // re-flatten positions already shifted via tree
        for (const link of links) {
          // path strings are absolute — shift manually
          link.d = shiftSvgPath(link.d, shiftX, shiftY)
        }
        for (const a of geometryArrows) {
          a.d = shiftSvgPath(a.d, shiftX, shiftY)
          a.headD = shiftSvgPath(a.headD, shiftX, shiftY)
          if (a.tailD) a.tailD = shiftSvgPath(a.tailD, shiftX, shiftY)
          a.labelX += shiftX
          a.labelY += shiftY
        }
        for (const s of geometrySummaries) {
          s.d = shiftSvgPath(s.d, shiftX, shiftY)
          s.labelX += shiftX
          s.labelY += shiftY
        }
      }
    }
  }

  return {
    width,
    height,
    root: rootNode,
    leftMains,
    rightMains,
    links,
    arrows: geometryArrows,
    summaries: geometrySummaries,
    theme,
    nodes,
  }
}

/**
 * Translate path by (dx, dy).
 * Only ABSOLUTE commands (M/L/C/Q/H/V/S/T/A) are shifted.
 * Relative commands (m/l/c/…) are left unchanged — shifting them corrupts curves
 * (this was the bug that made summary brackets look like scribbles).
 */
function shiftSvgPath(d: string, dx: number, dy: number): string {
  if (!dx && !dy) return d
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g)
  if (!tokens) return d
  const out: string[] = []
  let cmd = ''
  let pairIndex = 0
  for (const t of tokens) {
    if (/^[A-Za-z]$/.test(t)) {
      cmd = t
      pairIndex = 0
      out.push(t)
      continue
    }
    const n = parseFloat(t)
    // Relative commands: keep deltas as-is
    if (cmd === cmd.toLowerCase() && cmd !== 'h' && cmd !== 'v') {
      // relative m/l/c/q/s/t/a — do not shift
      out.push(String(n))
      pairIndex++
      continue
    }
    if (cmd === 'h') {
      out.push(String(n)) // relative horizontal
    } else if (cmd === 'v') {
      out.push(String(n)) // relative vertical
    } else if (cmd === 'H') {
      out.push(String(n + dx))
    } else if (cmd === 'V') {
      out.push(String(n + dy))
    } else {
      // Absolute M L C Q S T A — x,y pairs
      if (pairIndex % 2 === 0) out.push(String(n + dx))
      else out.push(String(n + dy))
      pairIndex++
    }
  }
  return out.join(' ')
}

// ---------------------------------------------------------------------------
// SVG render
// ---------------------------------------------------------------------------

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface RenderSvgOptions {
  /** Extra CSS injected into <style> */
  injectCss?: string
  /** Include XML declaration */
  xmlDeclaration?: boolean
}

/**
 * Render geometry result to a standalone SVG string (Node-friendly).
 */
export function renderGeometrySvg(geometry: GeometryResult, options: RenderSvgOptions = {}): string {
  const { width, height, nodes, links, arrows, summaries, theme } = geometry
  const bg = theme.cssVar['--bgcolor'] || '#f6f6f6'
  const parts: string[] = []

  if (options.xmlDeclaration !== false) {
    parts.push(
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`
    )
  }

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  )

  if (options.injectCss) {
    parts.push(`<style>${options.injectCss}</style>`)
  }

  // Background
  parts.push(`<rect width="100%" height="100%" fill="${escapeXml(bg)}"/>`)

  // Branch links under nodes
  parts.push(`<g class="links" fill="none">`)
  for (const link of links) {
    parts.push(
      `<path d="${link.d}" stroke="${escapeXml(link.color)}" stroke-width="${link.width}" fill="none"/>`
    )
  }
  parts.push(`</g>`)

  // Nodes
  parts.push(`<g class="nodes">`)
  for (const node of nodes) {
    parts.push(renderNodeSvg(node))
  }
  parts.push(`</g>`)

  // Summaries (brackets outside groups)
  if (summaries.length) {
    parts.push(`<g class="summaries" fill="none">`)
    for (const s of summaries) {
      parts.push(renderSummarySvg(s))
    }
    parts.push(`</g>`)
  }

  // Custom arrows on top
  if (arrows.length) {
    parts.push(`<g class="arrows" fill="none">`)
    for (const a of arrows) {
      parts.push(renderArrowSvg(a))
    }
    parts.push(`</g>`)
  }

  parts.push(`</svg>`)
  return parts.join('\n')
}

function renderArrowSvg(a: GeometryArrow): string {
  const opacity = a.opacity !== undefined ? ` opacity="${a.opacity}"` : ''
  const dash = a.strokeDasharray ? ` stroke-dasharray="${escapeXml(a.strokeDasharray)}"` : ''
  const linecap = a.strokeLinecap ? ` stroke-linecap="${escapeXml(a.strokeLinecap)}"` : ' stroke-linecap="round"'
  const chunks = [
    `<g id="a-${escapeXml(a.id)}" class="me-arrow">`,
    `<path d="${a.d}" stroke="${escapeXml(a.stroke)}" stroke-width="${a.strokeWidth}" fill="none"${dash}${linecap}${opacity}/>`,
    `<path d="${a.headD}" stroke="${escapeXml(a.stroke)}" stroke-width="${a.strokeWidth}" fill="none"${linecap}${opacity}/>`,
  ]
  if (a.tailD) {
    chunks.push(
      `<path d="${a.tailD}" stroke="${escapeXml(a.stroke)}" stroke-width="${a.strokeWidth}" fill="none"${linecap}${opacity}/>`
    )
  }
  if (a.label) {
    chunks.push(
      `<text x="${a.labelX}" y="${a.labelY}" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="${escapeXml(a.labelColor)}"${opacity}>${escapeXml(a.label)}</text>`
    )
  }
  chunks.push(`</g>`)
  return chunks.join('\n')
}

function renderSummarySvg(s: GeometrySummary): string {
  // Path from layoutSummaryBracket (same string as browser drawSummary).
  // Label mirrors .svg-label: HTML via foreignObject, max-width 200, overflow-wrap.
  const foW = Math.max(s.labelWidth + 8, 48)
  const foH = Math.max(s.labelHeight + 8, 22)
  const foX = s.anchor === 'end' ? s.labelX - foW : s.labelX
  const foY = s.labelY - foH / 2
  const textAlign = s.anchor === 'end' ? 'right' : 'left'

  return [
    `<g id="s-${escapeXml(s.id)}" class="me-summary">`,
    `<path d="${s.d}" stroke="${escapeXml(s.stroke)}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
    `<foreignObject x="${foX}" y="${foY}" width="${foW}" height="${foH}">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" class="svg-label" data-type="summary" style="color:${escapeXml(s.labelColor)};font-size:14px;line-height:1.2;overflow-wrap:break-word;max-width:${SUMMARY_LABEL_MAX_WIDTH}px;text-align:${textAlign};padding:3px;box-sizing:border-box;">${escapeXml(s.label)}</div>`,
    `</foreignObject>`,
    `</g>`,
  ].join('\n')
}

function renderNodeSvg(node: GeometryNode): string {
  const { rect, padding } = node
  const r = node.borderRadius
  const chunks: string[] = []

  chunks.push(`<g data-nodeid="me${escapeXml(node.id)}" class="me-node me-${node.role}">`)

  // Background rect
  chunks.push(
    `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${r}" ry="${r}" fill="${escapeXml(node.background)}" stroke="${escapeXml(node.borderColor)}" stroke-width="${node.borderWidth}"/>`
  )

  let cursorY = rect.y + padding.top + node.borderWidth
  const contentX = rect.x + padding.left + node.borderWidth

  // Image
  if (node.image) {
    chunks.push(
      `<image href="${escapeXml(node.image.url)}" x="${contentX}" y="${cursorY}" width="${node.image.width}" height="${node.image.height}" preserveAspectRatio="${node.image.fit === 'contain' ? 'xMidYMid meet' : node.image.fit === 'fill' ? 'none' : 'xMidYMid slice'}"/>`
    )
    cursorY += node.image.height + IMAGE_MARGIN_BOTTOM
  }

  // Text lines
  const lineHeight = node.fontSize * 1.4
  // SVG text y is baseline; first baseline ≈ fontSize from top of text block
  let textY = cursorY + node.fontSize
  for (const line of node.lines) {
    chunks.push(
      `<text x="${contentX}" y="${textY}" font-family="${escapeXml(node.fontFamily)}" font-size="${node.fontSize}" font-weight="${escapeXml(node.fontWeight)}" fill="${escapeXml(node.color)}">${escapeXml(line)}</text>`
    )
    textY += lineHeight
  }
  cursorY += node.lines.length * lineHeight

  // Tags
  if (node.tags && node.tags.length > 0) {
    cursorY += TAG_MARGIN_TOP
    let tx = contentX
    const tagH = TAG_FONT * 1.3 + TAG_PAD_Y * 2
    for (const tag of node.tags) {
      const tagText = tag.text
      let tw = 0
      for (const ch of tagText) {
        const code = ch.codePointAt(0) ?? 0
        tw += code > 0xff ? TAG_FONT : TAG_FONT * 0.55
      }
      tw = Math.ceil(tw + TAG_PAD_X * 2)
      const bg = (tag.style && (tag.style.background || tag.style.backgroundColor)) || '#d6f0f8'
      const fg = (tag.style && tag.style.color) || '#276f86'
      chunks.push(
        `<rect x="${tx}" y="${cursorY}" width="${tw}" height="${tagH}" rx="3" ry="3" fill="${escapeXml(String(bg))}"/>`,
        `<text x="${tx + TAG_PAD_X}" y="${cursorY + TAG_PAD_Y + TAG_FONT}" font-family="${escapeXml(node.fontFamily)}" font-size="${TAG_FONT}" fill="${escapeXml(String(fg))}">${escapeXml(tagText)}</text>`
      )
      tx += tw + TAG_GAP
    }
    cursorY += tagH
  }

  // Icons (emoji/text)
  if (node.icons && node.icons.length > 0) {
    cursorY += 2
    let ix = contentX
    for (const icon of node.icons) {
      chunks.push(
        `<text x="${ix}" y="${cursorY + ICON_SIZE * 0.85}" font-size="${ICON_SIZE}">${escapeXml(icon)}</text>`
      )
      ix += ICON_SIZE + 4
    }
  }

  // Hyperlink mark
  if (node.hyperLink) {
    const lx = rect.x + rect.width - padding.right - node.borderWidth - HYPERLINK_W + 4
    const ly = rect.y + rect.height / 2 + 4
    chunks.push(
      `<a href="${escapeXml(node.hyperLink)}" target="_blank"><text x="${lx}" y="${ly}" font-size="14">🔗</text></a>`
    )
  }

  chunks.push(`</g>`)
  return chunks.join('\n')
}

/**
 * One-shot: nodeData → SVG string (DOM-free).
 * Pass `arrows` / `summaries` in options (same as MindElixirData).
 */
export function nodeDataToSvg(nodeData: NodeObj, options: GeometryLayoutOptions & RenderSvgOptions = {}): string {
  const { injectCss, xmlDeclaration, ...layoutOpts } = options
  const geometry = layoutGeometry(nodeData, layoutOpts)
  return renderGeometrySvg(geometry, { injectCss, xmlDeclaration })
}

/**
 * Convenience: full MindElixir-like data object → SVG.
 */
export function mindMapToSvg(
  data: {
    nodeData: NodeObj
    arrows?: Arrow[]
    summaries?: Summary[]
    direction?: number
    theme?: Theme
    compact?: boolean
  },
  options: Omit<GeometryLayoutOptions, 'arrows' | 'summaries' | 'direction' | 'theme' | 'compact'> &
    RenderSvgOptions = {}
): string {
  const { injectCss, xmlDeclaration, ...rest } = options
  return nodeDataToSvg(data.nodeData, {
    ...rest,
    direction: data.direction as GeometryLayoutOptions['direction'],
    theme: data.theme,
    compact: data.compact,
    arrows: data.arrows,
    summaries: data.summaries,
    injectCss,
    xmlDeclaration,
  })
}
