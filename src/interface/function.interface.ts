import { Topic, Wrapper, Parent, Children } from "./dom.interface"
import { MindElixirData, MindElixirInstance, NodeObj } from "./mind-elixir.interface"

export type CreateInputDiv = (this: MindElixirInstance, el: Topic) => void
export type CreateWrapper = (
  this: MindElixirInstance,
  nodeObj: NodeObj,
  omitChildren?: boolean
) => {
  grp: Wrapper
  top: Parent
}

export type CreateLink = (this: MindElixirInstance, from: Topic, to: Topic, isInitPaint?: boolean, linkObj?: LinkItem) => void

export type LinkControllerData = {
  cx: number
  cy: number
  w: any
  h: any
}

export type ShowLinkController = (
  this: MindElixirInstance,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  linkItem: LinkItem,
  fromData: LinkControllerData,
  toData: LinkControllerData
) => void

export type CreateChildren = (this: MindElixirInstance, wrappers: Wrapper[]) => Children
export type CreateParent = (this: MindElixirInstance, nodeObj: NodeObj) => Parent
export type CreateTopic = (this: MindElixirInstance, nodeObj: NodeObj) => Topic

export type TNodeOperation = (this: MindElixirInstance, el?: Topic, node?: NodeObj) => void
export type TNodeMove = (this: MindElixirInstance, from: Topic, to?: Topic) => void
export type TNodeCopy = (this: MindElixirInstance, node: Topic, to: Topic) => void
export type AddChildFunction = (
  this: MindElixirInstance,
  nodeEle: Topic,
  node: NodeObj
) => {
  newTop: Parent
  newNodeObj: NodeObj
}
export type ReshapeNode = (this: MindElixirInstance, tpc: Topic, patchData: NodeObj) => void

export type Layout = (this: MindElixirInstance) => void
export type LayoutChildren = (this: MindElixirInstance, data: NodeObj[], container?: Children, direction?) => Children
export type LinkDiv = (this: MindElixirInstance, mainNode?: Wrapper | null) => void
export type TraverseChildrenFunc = (children: HTMLCollection, parent: Parent, isFirst?: boolean) => string
export type JudgeDirection = (this: MindElixirInstance, mainNode: Wrapper, obj: NodeObj) => void

export type ExpandNode = (this: MindElixirInstance, el: Topic, isExpand: boolean) => void
export type SelectNodeFunc = (this: MindElixirInstance, targetElement: Topic, isNewNode?: boolean, e?: MouseEvent) => void
export type CommonSelectFunc = (this: MindElixirInstance) => void
export type SiblingSelectFunc = (this: MindElixirInstance) => boolean

export type GetDataStringFunc = (this: MindElixirInstance) => string
export type GetDataFunc = (this: MindElixirInstance) => MindElixirData

export type RefreshFunc = (this: MindElixirInstance, data: MindElixirData) => void
