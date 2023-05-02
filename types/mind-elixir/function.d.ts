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

type TNodeOperation = (this: MindElixirInstance, el?: Topic, node?: NodeObj) => void
type TNodeMove = (this: MindElixirInstance, from: Topic, to?: Topic) => void
type TNodeCopy = (this: MindElixirInstance, node: Topic, to: Topic) => void
type AddChildFunction = (
  this: MindElixirInstance,
  nodeEle: Topic,
  node: NodeObj
) => {
  newTop: Parent
  newNodeObj: NodeObj
}
type ReshapeNode = (this: MindElixirInstance, tpc: Topic, patchData: NodeObj) => void

type Layout = (this: MindElixirInstance) => void
type LayoutChildren = (this: MindElixirInstance, data: NodeObj[], container?: Children, direction?) => Children
type LinkDiv = (this: MindElixirInstance, mainNode?: Wrapper) => void
type JudgeDirection = (this: MindElixirInstance, mainNode: Wrapper, obj: NodeObj) => void

type ExpandNode = (this: MindElixirInstance, el: Topic, isExpand: boolean) => void
type SelectNode = (this: MindElixirInstance, targetElement: Topic, isNewNode?: boolean) => void
type TCommonSelect = (this: MindElixirInstance) => void
type TSiblingSelect = (this: MindElixirInstance) => boolean
