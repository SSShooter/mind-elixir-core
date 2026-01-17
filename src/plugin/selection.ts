import type { MindElixirInstance, Topic } from '..'
import type { Behaviour } from '../viselect/src'
import SelectionArea from '../viselect/src'

export default function (mei: MindElixirInstance) {
  const triggers: Behaviour['triggers'] = mei.mouseSelectionButton === 2 ? [2] : [0]
  const selection = new SelectionArea({
    selectables: ['.map-container me-tpc'],
    boundaries: [mei.container],
    container: mei.selectionContainer,
    mindElixirInstance: mei, // 传递 MindElixir 实例
    features: {
      // deselectOnBlur: true,
      touch: false,
    },
    behaviour: {
      triggers,
      // Scroll configuration.
      scrolling: {
        // On scrollable areas the number on px per frame is devided by this amount.
        // Default is 10 to provide a enjoyable scroll experience.
        speedDivider: 10,
        startScrollMargins: { x: 50, y: 50 },
      },
    },
  })
    .on('beforestart', ({ event }) => {
      if (mei.spacePressed) return false
      const target = event!.target as HTMLElement
      if (target.id === 'input-box') return false
      if (target.className === 'circle') return false
      if (mei.container.querySelector('.context-menu')?.contains(target)) {
        // prevent context menu click clear selection
        return false
      }
      if (!(event as MouseEvent).ctrlKey && !(event as MouseEvent).metaKey) {
        if (target.tagName === 'ME-TPC' && target.classList.contains('selected')) {
          // Normal click cannot deselect
          // Also, deselection CANNOT be triggered before dragging, otherwise we can't drag multiple targets!!
          return false
        }
        // trigger `move` event here
        mei.clearSelection()
      }
      // console.log('beforestart')
      const selectionAreaElement = selection.getSelectionArea()
      selectionAreaElement.style.background = '#4f90f22d'
      selectionAreaElement.style.border = '1px solid #4f90f2'
      if (selectionAreaElement.parentElement) {
        selectionAreaElement.parentElement.style.zIndex = '9999'
      }
      return true
    })
    // .on('beforedrag', ({ event }) => {})
    .on(
      'move',
      ({
        store: {
          changed: { added, removed },
        },
      }) => {
        if (added.length > 0 || removed.length > 0) {
          // console.log('added ', added)
          // console.log('removed ', removed)
        }
        if (added.length > 0) {
          for (const el of added) {
            el.className = 'selected'
          }
          mei.currentNodes = [...mei.currentNodes, ...(added as Topic[])]
          mei.bus.fire(
            'selectNodes',
            (added as Topic[]).map(el => el.nodeObj)
          )
        }
        if (removed.length > 0) {
          for (const el of removed) {
            el.classList.remove('selected')
          }
          mei.currentNodes = mei.currentNodes!.filter(el => !removed?.includes(el))
          mei.bus.fire(
            'unselectNodes',
            (removed as Topic[]).map(el => el.nodeObj)
          )
        }
      }
    )
  mei.selection = selection
}
