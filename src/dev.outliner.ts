/**
 * Demo: MindElixir map + Outliner — ONE data, TWO views.
 * The outline binds to `mei`: it renders mei.nodeData, routes every mutation to
 * the map, and both views undo/redo on the map's own journal.
 *
 * Topics go through the SAME markdown/KaTeX renderer on both sides, so the
 * map and the outline stay visually in step too — the demo data's
 * `# Heading`, `**bold**`, tables and `$$math$$` nodes show it.
 * Open /outliner-demo.html with the vite dev server.
 */
import 'katex/dist/katex.min.css'
import MindElixir from './index'
import example from './exampleData/1'
import { renderMarkdown } from './dev.markdown'
import { Outliner } from './outliner'

interface Window {
  m?: MindElixir
  o?: Outliner
}
declare let window: Window

async function main() {
  const mei = new MindElixir({
    el: '#map',
    newTopicName: '子节点',
    allowUndo: true,
    markdown: renderMarkdown,
  })
  await mei.init(example)
  window.m = mei

  // 历史检查器要读同一个栈；Outliner 自己不再持有历史，直接取 mei 的那条
  // （allowUndo:true 才有），缺则说明初始化没完成
  if (!mei.historyStack) throw new Error('historyStack not ready — allowUndo must be true and init resolved')
  const stack = mei.historyStack

  // 绑定一行就够：传 `mei` 后，大纲直接渲染 mei.nodeData（一份数据两个视图），
  // 并用 mei.historyStack 同一条 undo/redo 时间线——两边操作都可回滚
  const outliner = new Outliner({
    el: '#outline',
    mei,
    fileName: '大纲',
    // renders the topic as HTML while not editing; focusing swaps back to the
    // raw markdown so the source stays editable
    markdown: renderMarkdown,
  })
  window.o = outliner

  // 历史检查器（复用上面已收窄的 stack）
  const entriesEl = document.getElementById('entries')!
  const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement
  const btnRedo = document.getElementById('btn-redo') as HTMLButtonElement
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement

  const opLabel = (meta: any) => (meta?.op ?? meta?.operation ?? '?') + (meta?.id ? ` · ${String(meta.id).slice(0, 8)}` : '')

  const renderInspector = () => {
    const entries = stack.getEntries()
    const cursor = stack.currentIndex
    entriesEl.innerHTML = ''
    if (entries.length === 0) {
      entriesEl.innerHTML = '<div class="empty">还没有操作 —— 去导图或大纲里随便改点什么</div>'
    }
    entries.forEach((entry, index) => {
      const row = document.createElement('div')
      row.className = `entry${index < cursor ? ' applied' : ''}`
      const cursorMark = index === cursor - 1 ? '<span class="cursor">▶</span>' : '<span class="cursor" style="visibility:hidden">▶</span>'
      const time = new Date(entry.time).toLocaleTimeString('zh-CN', { hour12: false })
      row.innerHTML = `${cursorMark}<span class="idx">${index + 1}</span><span class="doc ${entry.doc}">${entry.doc}</span><span>${opLabel(entry.meta)}</span><span style="color:#d1d5db">${time}</span>`
      entriesEl.appendChild(row)
    })
    btnUndo.disabled = !stack.canUndo
    btnRedo.disabled = !stack.canRedo
  }

  btnUndo.addEventListener('click', () => stack.undo())
  btnRedo.addEventListener('click', () => stack.redo())
  btnClear.addEventListener('click', () => stack.clear())
  stack.subscribe(renderInspector)
  renderInspector()
}

main()
