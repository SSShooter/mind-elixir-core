type MainLineParams = { x1: number; y1: number; x2: number; y2: number }
type SubLineParams = {
  pT: number
  pL: number
  pW: number
  pH: number
  cT: number
  cL: number
  cW: number
  cH: number
  direction: string // 'lhs' | 'rhs'
  isFirst: boolean | undefined
}
