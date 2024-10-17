import type { Trigger } from '@viselect/vanilla'
import SelectionArea from '@viselect/vanilla'
import type { MindElixirInstance, Topic } from '..'
import dragMoveHelper from '../utils/dragMoveHelper'

export default function (mei: MindElixirInstance) {
  const triggers: Trigger[] = mei.mouseSelectionButton === 2 ? [2] : [0]
  const selection = new SelectionArea({
    selectables: ['.map-container me-tpc'],
    boundaries: [mei.container],
    container: mei.selectionContainer,
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
      if (((event as MouseEvent).target as Topic).tagName === 'ME-TPC') return false
      if (((event as MouseEvent).target as HTMLElement).id === 'input-box') return false
      if (((event as MouseEvent).target as HTMLElement).className === 'circle') return false
      const selectionAreaElement = selection.getSelectionArea()
      selectionAreaElement.style.background = '#4f90f22d'
      selectionAreaElement.style.border = '1px solid #4f90f2'
      if (selectionAreaElement.parentElement) {
        selectionAreaElement.parentElement.style.zIndex = '9999'
      }
      return true
    })
    .on('start', ({ event }) => {
      if (!(event as MouseEvent).ctrlKey && !(event as MouseEvent).metaKey) {
        mei.clearSelection()
        selection.clearSelection(true, true)
      }
    })
    .on(
      'move',
      ({
        store: {
          changed: { added, removed },
        },
      }) => {
        dragMoveHelper.moved = true
        for (const el of added) {
          el.classList.add('selected')
        }

        for (const el of removed) {
          el.classList.remove('selected')
        }
      }
    )
    .on('stop', ({ store: { stored } }) => {
      mei.selectNodes(stored as Topic[])
    })
  mei.selection = selection
}
