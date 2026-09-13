/**
 * A document-agnostic undo/redo journal.
 *
 * Multiple "documents" (e.g. a MindElixir instance and an Outliner instance)
 * can share ONE HistoryStack. Every entry records which document it belongs to
 * plus the state before/after the operation, so undo/redo walks a single
 * linear timeline and dispatches the restore to the owning document. This is
 * what makes interleaved edits across documents undo seamlessly:
 *
 *   push(map, ...)   push(outline, ...)   Ctrl+Z -> outline steps back
 *   Ctrl+Z -> map steps back   Ctrl+Shift+Z -> outline steps forward ...
 *
 * Each document registers a restorer via `register()`. The restorer receives
 * the entry and the direction and applies the corresponding snapshot to its
 * own document (mind-elixir uses `mei.refresh`, the outliner re-renders).
 */
export type HistoryDirection = 'undo' | 'redo'

/** Apply the entry's snapshot (before for undo, after for redo) to the owning document. */
export type DocRestorer = (entry: HistoryEntry, direction: HistoryDirection) => void

export interface HistoryEntry<S = any> {
  /** Identifier of the document this entry belongs to. */
  doc: string
  /** Snapshot before the operation. Treat as immutable — the stack keeps owning it. */
  before: S
  /** Snapshot after the operation. */
  after: S
  /** Free-form payload the owner uses to restore selection etc. */
  meta?: any
  time: number
}

export class HistoryStack {
  private entries: HistoryEntry[] = []
  /** Number of applied entries; `entries[index]` is the next redo target. */
  private index = 0
  private restorers = new Map<string, DocRestorer>()
  private listeners: Array<() => void> = []

  /** Attach a document to the stack. Returns an unregister function. */
  register(doc: string, restore: DocRestorer): () => void {
    this.restorers.set(doc, restore)
    return () => {
      if (this.restorers.get(doc) === restore) this.restorers.delete(doc)
    }
  }

  /** Subscribe to stack changes (push/undo/redo/clear), e.g. for an inspector UI. */
  subscribe(fn: () => void): () => void {
    this.listeners.push(fn)
    return () => {
      const i = this.listeners.indexOf(fn)
      if (i !== -1) this.listeners.splice(i, 1)
    }
  }

  /**
   * Record an operation. `before`/`after` must be snapshots (clones) of the
   * document state; the stack never mutates them.
   *
   * Pushing while undone entries exist truncates the redo branch, matching the
   * classic linear-history behavior.
   */
  push<S>(doc: string, before: S, after: S, meta?: any): void {
    // Drop the redo branch — the timeline is linear
    this.entries.length = this.index
    this.entries.push({ doc, before, after, meta, time: Date.now() })
    this.index = this.entries.length
    this.emit()
  }

  get canUndo(): boolean {
    return this.index > 0
  }

  get canRedo(): boolean {
    return this.index < this.entries.length
  }

  get size(): number {
    return this.entries.length
  }

  get currentIndex(): number {
    return this.index
  }

  getEntries(): readonly HistoryEntry[] {
    return this.entries
  }

  /** Step back one entry and restore the owning document. */
  undo(): HistoryEntry | null {
    if (!this.canUndo) return null
    this.index--
    const entry = this.entries[this.index]
    this.restorers.get(entry.doc)?.(entry, 'undo')
    this.emit()
    return entry
  }

  /** Step forward one entry and restore the owning document. */
  redo(): HistoryEntry | null {
    if (!this.canRedo) return null
    const entry = this.entries[this.index]
    this.index++
    this.restorers.get(entry.doc)?.(entry, 'redo')
    this.emit()
    return entry
  }

  /** Drop every entry. Document states stay as they are. */
  clear(): void {
    this.entries.length = 0
    this.index = 0
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach(fn => fn())
  }
}
