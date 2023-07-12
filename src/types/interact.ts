import type { Topic } from './dom'
import type { MindElixirInstance } from './index'

export type CancelFocus = (this: MindElixirInstance) => void
export type InitLeft = (this: MindElixirInstance) => void
export type InitRight = (this: MindElixirInstance) => void
export type InitSide = (this: MindElixirInstance) => void
export type SetLocale = (this: MindElixirInstance, locale: string) => void
export type FocusNode = (this: MindElixirInstance, el: Topic) => void
export type EnableEdit = (this: MindElixirInstance) => void
export type DisableEdit = (this: MindElixirInstance) => void
export type Scale = (this: MindElixirInstance, val: number) => void
export type ToCenter = (this: MindElixirInstance) => void
export type MindElixirPlugin = (instance: MindElixirInstance) => void
export type Install = (this: MindElixirInstance, plugin: MindElixirPlugin) => void
