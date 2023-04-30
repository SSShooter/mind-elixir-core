type ExpandNode = (el: Topic, isExpand: boolean) => void
type CreateWrapper = (
  nodeObj: NodeObj,
  omitChildren?: boolean
) => {
  grp: Wrapper
  top: Parent
}
type CreateChildren = (wrappers: Wrapper[]) => Children
type LinkDiv = (mainNode?: Wrapper) => void
type JudgeDirection = (mainNode: Wrapper, obj: NodeObj) => void

type AddChildFunction = (
  this: MindElixirInstance,
  nodeEle,
  node: NodeObj
) => {
  newTop: Parent
  newNodeObj: NodeObj
}
