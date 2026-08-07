import type MindElixir from '../index'
import { DirectionClass } from '../types/index'

export interface MainLineParams {
  pT: number
  pL: number
  pW: number
  pH: number
  cT: number
  cL: number
  cW: number
  cH: number
  direction: DirectionClass
  containerHeight: number
  containerWidth?: number
}

export interface SubLineParams {
  pT: number
  pL: number
  pW: number
  pH: number
  cT: number
  cL: number
  cW: number
  cH: number
  direction: DirectionClass
  isFirst: boolean | undefined
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands

// rounded right-angle (orthogonal) connector for top-down layout:
// vertical -> horizontal -> vertical, with rounded corners
const roundedVertical = function (x1: number, y1: number, x2: number, y2: number, radius = 8) {
  if (x1 === x2) return `M ${x1} ${y1} V ${y2}`
  const midY = (y1 + y2) / 2
  const dir = x2 > x1 ? 1 : -1
  const r = Math.min(radius, Math.abs(x2 - x1) / 2, Math.abs(midY - y1), Math.abs(y2 - midY))
  return `M ${x1} ${y1} V ${midY - r} Q ${x1} ${midY} ${x1 + dir * r} ${midY} H ${x2 - dir * r} Q ${x2} ${midY} ${x2} ${midY + r} V ${y2}`
}

export function main({ pT, pL, pW, pH, cT, cL, cW, cH, direction, containerHeight, containerWidth }: MainLineParams) {
  if (direction === DirectionClass.DOWN) {
    // top-down: from root bottom center to main node top center
    const x1 = pL + pW / 2
    const x2 = cL + cW / 2
    const y1 = pT + pH
    const y2 = cT
    return roundedVertical(x1, y1, x2, y2)
  }
  let x1 = pL + pW / 2
  const y1 = pT + pH / 2
  let x2
  if (direction === DirectionClass.LHS) {
    x2 = cL + cW
  } else {
    x2 = cL
  }
  const y2 = cT + cH / 2
  const pct = Math.abs(y2 - y1) / containerHeight
  const offset = (1 - pct) * 0.25 * (pW / 2)
  if (direction === DirectionClass.LHS) {
    x1 = x1 - pW / 10 - offset
  } else {
    x1 = x1 + pW / 10 + offset
  }
  return `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
}

export function sub(this: MindElixir, { pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams) {
  if (direction === DirectionClass.DOWN) {
    // top-down: from parent bottom center to child top center
    const x1 = pL + pW / 2
    const y1 = pT + pH
    const x2 = cL + cW / 2
    const y2 = cT
    return roundedVertical(x1, y1, x2, y2)
  }
  const GAP = parseInt(this.container.style.getPropertyValue('--node-gap-x')) // cache?
  // const GAP = 30
  let y1 = 0
  let end = 0
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1 = 0
  let x2 = 0
  let xMid = 0
  const offset = (Math.abs(y1 - y2) / 300) * GAP
  if (direction === DirectionClass.LHS) {
    xMid = pL
    x1 = xMid + GAP
    x2 = xMid - GAP
    end = cL + GAP
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid + offset} ${y2} ${x2} ${y2} H ${end}`
  } else {
    xMid = pL + pW
    x1 = xMid - GAP
    x2 = xMid + GAP
    end = cL + cW - GAP
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid - offset} ${y2} ${x2} ${y2} H ${end}`
  }
}
