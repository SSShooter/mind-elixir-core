import type { Topic, Wrapper, Parent, Children, CustomSvg } from './dom'
import type { MindElixirInstance, MindElixirData, NodeObj, LinkItem } from './index'

export type Init = (this: MindElixirInstance, data: MindElixirData) => void
export type CreateInputDiv = (this: MindElixirInstance, el: Topic) => void

export type CreateChildren = (this: MindElixirInstance, wrappers: Wrapper[]) => Children
export type CreateTopic = (this: MindElixirInstance, nodeObj: NodeObj) => Topic

export type InsertNodeCommon = (this: MindElixirInstance, el?: Topic, node?: NodeObj) => void
export type RemoveNode = (this: MindElixirInstance, el?: Topic) => void
export type MoveNodeCommon = (this: MindElixirInstance, target?: Topic) => void
export type MoveNodeToCommon = (this: MindElixirInstance, from: Topic, to: Topic) => void
export type TNodeCopy = (this: MindElixirInstance, node: Topic, to: Topic) => void
export type AddChildFunction = (
  this: MindElixirInstance,
  nodeEle: Topic,
  node?: NodeObj
) => {
  newTop: Parent
  newNodeObj: NodeObj
} | null

export type RemoveLink = (this: MindElixirInstance, link?: CustomSvg) => void
export type SelectLink = (this: MindElixirInstance, link: CustomSvg) => void

export type LinkControllerData = {
  cx: number
  cy: number
  w: number
  h: number
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
export type HideLinkController = (this: MindElixirInstance) => void

export type ExpandNode = (this: MindElixirInstance, el: Topic, isExpand?: boolean) => void
export type SelectNodeFunc = (this: MindElixirInstance, targetElement: Topic, isNewNode?: boolean, e?: MouseEvent) => void
export type CommonSelectFunc = (this: MindElixirInstance) => void
export type SiblingSelectFunc = (this: MindElixirInstance) => boolean

export type GetDataStringFunc = (this: MindElixirInstance) => string
export type GetDataFunc = (this: MindElixirInstance) => MindElixirData

export type RefreshFunc = (this: MindElixirInstance, data?: MindElixirData) => void
export type SetNodeTopic = (this: MindElixirInstance, el: Topic, topic: string) => void
