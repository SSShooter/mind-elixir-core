type Init = (this: MindElixirInstance, data: MindElixirData) => void
type CreateInputDiv = (this: MindElixirInstance, el: Topic) => void
type CreateWrapper = (
  this: MindElixirInstance,
  nodeObj: NodeObj,
  omitChildren?: boolean
) => {
  grp: Wrapper
  top: Parent
}
type CreateChildren = (this: MindElixirInstance, wrappers: Wrapper[]) => Children
type CreateParent = (this: MindElixirInstance, nodeObj: NodeObj) => Parent
type CreateTopic = (this: MindElixirInstance, nodeObj: NodeObj) => Topic

type InsertNodeCommon = (this: MindElixirInstance, el?: Topic, node?: NodeObj) => void
type RemoveNode = (this: MindElixirInstance, el?: Topic) => void
type MoveNodeCommon = (this: MindElixirInstance, target?: Topic) => void
type MoveNodeToCommon = (this: MindElixirInstance, from: Topic, to: Topic) => void
type TNodeCopy = (this: MindElixirInstance, node: Topic, to: Topic) => void
type AddChildFunction = (
  this: MindElixirInstance,
  nodeEle: Topic,
  node?: NodeObj
) => {
  newTop: Parent
  newNodeObj: NodeObj
} | null
type ReshapeNode = (this: MindElixirInstance, tpc: Topic, patchData: NodeObj) => void

type Layout = (this: MindElixirInstance) => void
type LayoutChildren = (this: MindElixirInstance, data: NodeObj[], container?: Children, direction?: number) => Children
type LinkDiv = (this: MindElixirInstance, mainNode?: Wrapper) => void
type TraverseChildrenFunc = (children: HTMLCollection, parent: Parent, isFirst?: boolean) => string
type JudgeDirection = (this: MindElixirInstance, mainNode: Wrapper, obj: NodeObj) => void

type CreateLink = (this: MindElixirInstance, from: Topic, to: Topic, isInitPaint?: boolean, linkObj?: LinkItem) => void
type RemoveLink = (this: MindElixirInstance, link?: CustomSvg) => void
type SelectLink = (this: MindElixirInstance, link: CustomSvg) => void

type LinkControllerData = {
  cx: number
  cy: number
  w: any
  h: any
}
type ShowLinkController = (
  this: MindElixirInstance,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  linkItem: LinkItem,
  fromData: LinkControllerData,
  toData: LinkControllerData
) => void
type HideLinkController = (this: MindElixirInstance) => void

type ExpandNode = (this: MindElixirInstance, el: Topic, isExpand?: boolean) => void
type SelectNodeFunc = (this: MindElixirInstance, targetElement: Topic, isNewNode?: boolean, e?: MouseEvent) => void
type CommonSelectFunc = (this: MindElixirInstance) => void
type SiblingSelectFunc = (this: MindElixirInstance) => boolean

type GetDataStringFunc = (this: MindElixirInstance) => string
type GetDataFunc = (this: MindElixirInstance) => MindElixirData

type RefreshFunc = (this: MindElixirInstance, data?: MindElixirData) => void
type SetNodeTopic = (this: MindElixirInstance, el: Topic, topic: string) => void
