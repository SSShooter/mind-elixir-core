import type { MindElixirInstance } from '..'
import { GAP } from '../const'

export type MainLineParams = {
  pT: number
  pL: number
  pW: number
  pH: number
  cT: number
  cL: number
  cW: number
  cH: number
  direction: 'lhs' | 'rhs'
  containerHeight: number
}

export type SubLineParams = {
  pT: number
  pL: number
  pW: number
  pH: number
  cT: number
  cL: number
  cW: number
  cH: number
  direction: 'lhs' | 'rhs'
  isFirst: boolean | undefined
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands

export function main({ pT, pL, pW, pH, cT, cL, cW, cH, direction, containerHeight }: MainLineParams) {
  let x1 = pL + pW / 2
  const y1 = pT + pH / 2
  let x2
  if (direction === 'lhs') {
    x2 = cL + cW
  } else {
    x2 = cL
  }
  const y2 = cT + cH / 2
  const pct = Math.abs(y2 - y1) / containerHeight
  const offset = (1 - pct) * 0.25 * (pW / 2)
  if (direction === 'lhs') {
    x1 = x1 - pW / 10 - offset
  } else {
    x1 = x1 + pW / 10 + offset
  }
  return `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
}

export function sub(this: MindElixirInstance, { pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams) {
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
  if (direction === 'lhs') {
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
