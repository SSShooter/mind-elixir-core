import type { MainLineParams, SubLineParams } from './utils/generateBranch'
import { DirectionClass } from './types/index'
import type { MindElixirInstance } from './types/index'

// 1. Markmap-style (一直保持下划线)
// 根节点到一级节点、以及各级节点之间，均是从父节点的底部连接到子节点的底部，并带有一条贯穿子节点的下划线
export function markmapMain({ pT, pL, pW, pH, cT, cL, cW, cH, direction }: MainLineParams) {
  const y1 = pT + pH / 2 // 根节点从垂直中心出发
  const y2 = cT + cH // 连接到子节点底部
  let x1, x2, end, ctrlX

  // 利用左右两边各 15px 的 padding 空间作为曲线缓冲，同时缩短下划线(end)使之完美对齐
  if (direction === DirectionClass.LHS) {
    x1 = pL + 15
    x2 = cL + cW - 15
    end = cL + 15
    ctrlX = x1 - (x1 - x2) / 2
  } else {
    x1 = pL + pW - 15
    x2 = cL + 15
    end = cL + cW - 15
    ctrlX = x1 + (x2 - x1) / 2
  }
  return `M ${x1} ${y1} C ${ctrlX} ${y1} ${ctrlX} ${y2} ${x2} ${y2} H ${end}`
}

export function markmapSub(this: MindElixirInstance, { pT, pL, pW, pH, cT, cL, cW, cH, direction }: SubLineParams) {
  const y1 = pT + pH // 父节点从底部下划线末端出发
  const y2 = cT + cH // 连接到子节点底部下划线

  let x1, x2, end, ctrlX
  if (direction === DirectionClass.LHS) {
    x1 = pL + 15
    x2 = cL + cW - 15
    end = cL + 15
    ctrlX = x1 - (x1 - x2) / 2
  } else {
    x1 = pL + pW - 15
    x2 = cL + 15
    end = cL + cW - 15
    ctrlX = x1 + (x2 - x1) / 2
  }
  return `M ${x1} ${y1} C ${ctrlX} ${y1} ${ctrlX} ${y2} ${x2} ${y2} H ${end}`
}

// 2. 直角连接 - 连到中点 (Straight lines, center connection)
export function straightMain({ pT, pL, pW, pH, cT, cL, cW, cH, direction }: MainLineParams) {
  const y1 = pT + pH / 2
  const y2 = cT + cH / 2
  let x1, x2
  if (direction === DirectionClass.LHS) {
    x1 = pL + 15
    x2 = cL + cW - 15
  } else {
    x1 = pL + pW - 15
    x2 = cL + 15
  }
  const midX = x1 + (x2 - x1) / 2
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`
}

export function straightSub(this: MindElixirInstance, { pT, pL, pW, pH, cT, cL, cW, cH, direction }: SubLineParams) {
  const y1 = pT + pH / 2
  const y2 = cT + cH / 2
  let x1, x2
  if (direction === DirectionClass.LHS) {
    x1 = pL + 15
    x2 = cL + cW - 15
  } else {
    x1 = pL + pW - 15
    x2 = cL + 15
  }
  const midX = x1 + (x2 - x1) / 2
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`
}

// 3. 直角连接 - 连到下划线 (Straight lines, underline connection)
export function straightUnderlineMain({ pT, pL, pW, pH, cT, cL, cW, cH, direction }: MainLineParams) {
  const y1 = pT + pH / 2
  const y2 = cT + cH
  let x1, x2, end
  if (direction === DirectionClass.LHS) {
    x1 = pL + 15
    x2 = cL + cW - 15
    end = cL + 15
  } else {
    x1 = pL + pW - 15
    x2 = cL + 15
    end = cL + cW - 15
  }
  const midX = x1 + (x2 - x1) / 2
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2} H ${end}`
}

export function straightUnderlineSub(this: MindElixirInstance, { pT, pL, pW, pH, cT, cL, cW, cH, direction }: SubLineParams) {
  const y1 = pT + pH
  const y2 = cT + cH
  let x1, x2, end
  if (direction === DirectionClass.LHS) {
    x1 = pL + 15
    x2 = cL + cW - 15
    end = cL + 15
  } else {
    x1 = pL + pW - 15
    x2 = cL + 15
    end = cL + cW - 15
  }
  const midX = x1 + (x2 - x1) / 2
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2} H ${end}`
}
