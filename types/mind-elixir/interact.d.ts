type CancelFocus = (this: MindElixirInstance) => void
type InitLeft = (this: MindElixirInstance) => void
type InitRight = (this: MindElixirInstance) => void
type InitSide = (this: MindElixirInstance) => void
type SetLocale = (this: MindElixirInstance, locale: string) => void
type FocusNode = (this: MindElixirInstance, el: Topic) => void
type EnableEdit = (this: MindElixirInstance) => void
type DisableEdit = (this: MindElixirInstance) => void
type Scale = (this: MindElixirInstance, val: number) => void
type ToCenter = (this: MindElixirInstance) => void
type MindElixirPlugin = (instance: MindElixirInstance) => void
type Install = (this: MindElixirInstance, plugin: MindElixirPlugin) => void
