import { GAP } from '../const'

export type MainLineParams = { x1: number; y1: number; x2: number; y2: number; direction: 'lhs' | 'rhs' }
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

export function main({ x1, y1, x2, y2 }: MainLineParams) {
  return `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
}

export function sub({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams) {
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
  const offset = Math.min(Math.abs(y1 - y2) / 800, 1.2) * GAP
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
