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
      touch: false,
      singleTap: {
        allow: false,
      },
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
      console.log('beforestart', mei.ptState)
      if (!mei.editable) return false
      if (mei.spacePressed) return false
      if (mei.ptState !== 5) return false
      const target = event!.target as HTMLElement
      if (target.id === 'input-box') return false
      if (target.className === 'circle') return false
      if (mei.container.querySelector('.context-menu')?.contains(target)) {
        // prevent context menu click clear selection
        return false
      }
      if (!(event as MouseEvent).ctrlKey && !(event as MouseEvent).metaKey) {
        mei.clearSelection()
      }
      // console.log('beforestart')
      const selectionAreaElement = selection.getSelectionArea()
      selectionAreaElement.style.background = '#4f90f22d'
      selectionAreaElement.style.border = '1px solid #4f90f2'
      selectionAreaElement.style.borderRadius = '3px'
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
          const newNodes = (added as Topic[]).filter(el => !mei.currentNodes?.includes(el))
          if (newNodes.length > 0) {
            for (const el of newNodes) {
              el.className = 'selected'
            }
            mei.currentNodes = [...(mei.currentNodes || []), ...newNodes]
            mei.bus.fire(
              'selectNodes',
              newNodes.map(el => el.nodeObj)
            )
          }
        }
        if (removed.length > 0) {
          const removedNodes = (removed as Topic[]).filter(el => mei.currentNodes?.includes(el))
          if (removedNodes.length > 0) {
            for (const el of removedNodes) {
              el.classList.remove('selected')
            }
            mei.currentNodes = (mei.currentNodes || []).filter(el => !removedNodes.includes(el))
            mei.bus.fire(
              'unselectNodes',
              removedNodes.map(el => el.nodeObj)
            )
          }
        }
      }
    )
  mei.selection = selection
}
