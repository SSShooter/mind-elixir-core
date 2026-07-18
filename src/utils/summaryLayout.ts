/**
 * Pure summary bracket geometry (no DOM).
 * Shared by browser drawSummary and DOM-free layoutGeometry.
 *
 * Path uses ABSOLUTE commands only (M/C/L/H) so canvas shifts stay correct.
 * Curve shape is identical to the historical relative-path formula.
 */
import { DirectionClass } from '../types/index'

/**
 * Axis-aligned box of one summarized sibling's me-wrapper.
 */
export interface SummaryItemBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Curly-bracket path + label anchor for a summary range.
 */
export interface SummaryBracketLayout {
  pathD: string
  labelX: number
  labelY: number
  anchor: 'start' | 'end'
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Compute summary curly-bracket path and label anchor from wrapper boxes.
 * Single source of truth for summary SVG geometry (browser + Node).
 */
export function layoutSummaryBracket(
  boxes: SummaryItemBox[],
  side: DirectionClass,
  parentIsRoot: boolean
): SummaryBracketLayout {
  if (!boxes.length) {
    throw new Error('layoutSummaryBracket: empty boxes')
  }

  let left = Infinity
  let right = 0
  let startTop = 0
  let endBottom = 0
  const single = boxes.length === 1

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i]
    const inset = single ? 10 : 20
    if (i === 0) startTop = box.y + inset
    if (i === boxes.length - 1) endBottom = box.y + box.height - inset
    if (box.x < left) left = box.x
    if (box.x + box.width > right) right = box.x + box.width
  }

  // Non-root parents get +10 vertical shift (historical drawSummary behavior)
  const yOffset = parentIsRoot ? 0 : 10
  let top = startTop + yOffset
  let bottom = endBottom + yOffset
  // Guard short wrappers so the curly bracket stays well-formed
  const minSpan = 24
  if (bottom < top + minSpan) {
    const mid = (top + bottom) / 2
    top = mid - minSpan / 2
    bottom = mid + minSpan / 2
  }
  const md = (top + bottom) / 2

  if (side === DirectionClass.LHS) {
    // Historical: M l+10,t c -5 0 -10 5 -10 10 L l,b-10 c 0 5 5 10 10 10 M l,md h -10
    const pathD = [
      `M ${left + 10} ${top}`,
      `C ${left + 5} ${top} ${left} ${top + 5} ${left} ${top + 10}`,
      `L ${left} ${bottom - 10}`,
      `C ${left} ${bottom - 5} ${left + 5} ${bottom} ${left + 10} ${bottom}`,
      `M ${left} ${md}`,
      `H ${left - 10}`,
    ].join(' ')
    return {
      pathD,
      labelX: left - 20,
      labelY: md,
      anchor: 'end',
      left,
      right,
      top,
      bottom,
    }
  }

  // Historical: M r-10,t c 5 0 10 5 10 10 L r,b-10 c 0 5 -5 10 -10 10 M r,md h 10
  const pathD = [
    `M ${right - 10} ${top}`,
    `C ${right - 5} ${top} ${right} ${top + 5} ${right} ${top + 10}`,
    `L ${right} ${bottom - 10}`,
    `C ${right} ${bottom - 5} ${right - 5} ${bottom} ${right - 10} ${bottom}`,
    `M ${right} ${md}`,
    `H ${right + 10}`,
  ].join(' ')
  return {
    pathD,
    labelX: right + 20,
    labelY: md,
    anchor: 'start',
    left,
    right,
    top,
    bottom,
  }
}
