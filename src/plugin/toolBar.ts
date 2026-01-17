import type { MindElixirInstance } from '../types/index'
import { getTranslate } from '../utils/index'
import side from '../icons/side.svg?raw'
import left from '../icons/left.svg?raw'
import right from '../icons/right.svg?raw'
import full from '../icons/full.svg?raw'
import living from '../icons/living.svg?raw'
import zoomin from '../icons/zoomin.svg?raw'
import zoomout from '../icons/zoomout.svg?raw'

import './toolBar.less'

const map: Record<string, string> = {
  side,
  left,
  right,
  full,
  living,
  zoomin,
  zoomout,
}
const createButton = (id: string, name: string) => {
  const button = document.createElement('span')
  button.id = id
  button.innerHTML = map[name]
  return button
}

function createToolBarRBContainer(mind: MindElixirInstance) {
  const toolBarRBContainer = document.createElement('div')
  const fc = createButton('fullscreen', 'full')
  const gc = createButton('toCenter', 'living')
  const zo = createButton('zoomout', 'zoomout')
  const zi = createButton('zoomin', 'zoomin')
  toolBarRBContainer.appendChild(fc)
  toolBarRBContainer.appendChild(gc)
  toolBarRBContainer.appendChild(zo)
  toolBarRBContainer.appendChild(zi)
  toolBarRBContainer.className = 'mind-elixir-toolbar rb'

  let fullscreenChangeData: {
    containerRect: DOMRect
    currentTransform: { x: number; y: number }
    mapCenterX: number
    mapCenterY: number
  } | null = null

  const recordCurrentState = () => {
    const containerRect = mind.container.getBoundingClientRect()
    const currentTransform = getTranslate(mind.map.style.transform)

    const containerCenterX = containerRect.width / 2
    const containerCenterY = containerRect.height / 2

    const mapCenterX = (containerCenterX - currentTransform.x) / mind.scaleVal
    const mapCenterY = (containerCenterY - currentTransform.y) / mind.scaleVal

    fullscreenChangeData = {
      containerRect,
      currentTransform,
      mapCenterX,
      mapCenterY,
    }
  }

  const handleFullscreenChange = () => {
    if (fullscreenChangeData) {
      const newContainerRect = mind.container.getBoundingClientRect()
      const newContainerCenterX = newContainerRect.width / 2
      const newContainerCenterY = newContainerRect.height / 2
      const newTransformX = newContainerCenterX - fullscreenChangeData.mapCenterX * mind.scaleVal
      const newTransformY = newContainerCenterY - fullscreenChangeData.mapCenterY * mind.scaleVal

      const dx = newTransformX - fullscreenChangeData.currentTransform.x
      const dy = newTransformY - fullscreenChangeData.currentTransform.y

      mind.move(dx, dy)
    }
  }

  mind.el.addEventListener('fullscreenchange', handleFullscreenChange)
  fc.onclick = () => {
    recordCurrentState()
    if (document.fullscreenElement !== mind.el) {
      mind.el.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // There is an unresolvable issue here: when users exit fullscreen using the ESC key,
  // the browser doesn't provide an opportunity to call recordCurrentState,
  // so exiting with ESC cannot return to the center point before entering fullscreen.
  // Although this could be implemented by periodic calculations or listening to move/zoom events, it's too complex.
  // After weighing the options, we've decided not to implement it for now.

  gc.onclick = () => {
    mind.toCenter()
  }
  zo.onclick = () => {
    mind.scale(mind.scaleVal - mind.scaleSensitivity)
  }
  zi.onclick = () => {
    mind.scale(mind.scaleVal + mind.scaleSensitivity)
  }
  return toolBarRBContainer
}
function createToolBarLTContainer(mind: MindElixirInstance) {
  const toolBarLTContainer = document.createElement('div')
  const l = createButton('tbltl', 'left')
  const r = createButton('tbltr', 'right')
  const s = createButton('tblts', 'side')

  toolBarLTContainer.appendChild(l)
  toolBarLTContainer.appendChild(r)
  toolBarLTContainer.appendChild(s)
  toolBarLTContainer.className = 'mind-elixir-toolbar lt'
  l.onclick = () => {
    mind.initLeft()
  }
  r.onclick = () => {
    mind.initRight()
  }
  s.onclick = () => {
    mind.initSide()
  }
  return toolBarLTContainer
}

export default function (mind: MindElixirInstance) {
  mind.container.append(createToolBarRBContainer(mind))
  mind.container.append(createToolBarLTContainer(mind))
}
