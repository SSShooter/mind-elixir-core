import type { MindElixirInstance } from '..'
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

export function main({ pT, pL, pW, pH, cT, cL, cW, cH, direction, containerHeight }: MainLineParams) {
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

/**
 * Pure sub-branch path generator (DOM-free).
 * Used by both browser `linkDiv` and geometry/SSR render pipeline.
 */
export function subPath(
  { pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams,
  gap: number
): string {
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
  const offset = (Math.abs(y1 - y2) / 300) * gap
  if (direction === DirectionClass.LHS) {
    xMid = pL
    x1 = xMid + gap
    x2 = xMid - gap
    end = cL + gap
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid + offset} ${y2} ${x2} ${y2} H ${end}`
  } else {
    xMid = pL + pW
    x1 = xMid - gap
    x2 = xMid + gap
    end = cL + cW - gap
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid - offset} ${y2} ${x2} ${y2} H ${end}`
  }
}

export function sub(this: MindElixirInstance, params: SubLineParams) {
  const gap = parseInt(this.container.style.getPropertyValue('--node-gap-x')) || 30
  return subPath(params, gap)
}
