import type { Behaviour } from '@viselect/vanilla'
import SelectionArea from '@viselect/vanilla'
import type { MindElixirInstance, Topic } from '..'

// TODO: boundaries move missing
export default function (mei: MindElixirInstance) {
  const triggers: Behaviour['triggers'] = mei.mouseSelectionButton === 2 ? [2] : [0]
  const selection = new SelectionArea({
    selectables: ['.map-container me-tpc'],
    boundaries: [mei.container],
    container: mei.selectionContainer,
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
        // Browsers handle mouse-wheel events differently, this number will be used as
        // numerator to calculate the mount of px while scrolling manually: manualScrollSpeed / scrollSpeedDivider.
        manualSpeed: 750,
        // This property defines the virtual inset margins from the borders of the container
        // component that, when crossed by the mouse/touch, trigger the scrolling. Useful for
        // fullscreen containers.
        startScrollMargins: { x: 10, y: 10 },
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
