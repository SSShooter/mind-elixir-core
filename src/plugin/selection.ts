import SelectionArea from '@viselect/vanilla'
import type { MindElixirInstance, Topic } from '..'
import dragMoveHelper from '../utils/dragMoveHelper'

export default function (mei: MindElixirInstance) {
  const selection = new SelectionArea({
    selectables: ['#map me-tpc'],
    boundaries: ['#map .map-container'],
    container: '.map-container',
    behaviour: {
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
    features: {
      // Configuration in case a selectable gets just clicked.
      singleTap: {
        // Enable single-click selection (Also disables range-selection via shift + ctrl).
        allow: true,

        // 'native' (element was mouse-event target) or 'touch' (element visually touched).
        intersect: 'native',
      },
    },
  })
    .on('beforestart', ({ event }) => {
      if ((event as MouseEvent).button !== 0) return false
      if (((event as MouseEvent).target as Topic).tagName === 'ME-TPC') return false
      if (((event as MouseEvent).target as HTMLElement).id === 'input-box') return false
      return true
    })
    .on('start', ({ store, event }) => {
      console.log(store, 'store')
      console.log(event, 'event')
      if (!(event as MouseEvent).ctrlKey && !(event as MouseEvent).metaKey) {
        mei.unselectNodes()
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
      console.log(stored, 'stored')
      mei.selectNodes(stored as Topic[])
    })
  console.log(selection, 'selection')
}
