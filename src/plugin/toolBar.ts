const createButton = (id, name) => {
  const button = document.createElement('span')
  button.id = id
  button.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-${name}"></use>
  </svg>`
  return button
}

function createToolBarRBContainer(mind) {
  const toolBarRBContainer = document.createElement('toolbar')
  const fc = createButton('fullscreen', 'full')
  const gc = createButton('toCenter', 'living')
  const zo = createButton('zoomout', 'move')
  const zi = createButton('zoomin', 'add')
  const percentage = document.createElement('span')
  percentage.innerText = '100%'
  toolBarRBContainer.appendChild(fc)
  toolBarRBContainer.appendChild(gc)
  toolBarRBContainer.appendChild(zo)
  toolBarRBContainer.appendChild(zi)
  // toolBarRBContainer.appendChild(percentage)
  toolBarRBContainer.className = 'rb'
  fc.onclick = () => {
    mind.container.requestFullscreen()
  }
  gc.onclick = () => {
    mind.toCenter()
  }
  zo.onclick = () => {
    if (mind.scaleVal < 0.6) return
    mind.scale((mind.scaleVal -= 0.2))
  }
  zi.onclick = () => {
    if (mind.scaleVal > 1.6) return
    mind.scale((mind.scaleVal += 0.2))
  }
  return toolBarRBContainer
}
function createToolBarLTContainer(mind) {
  const toolBarLTContainer = document.createElement('toolbar')
  const l = createButton('tbltl', 'left')
  const r = createButton('tbltr', 'right')
  const s = createButton('tblts', 'side')

  toolBarLTContainer.appendChild(l)
  toolBarLTContainer.appendChild(r)
  toolBarLTContainer.appendChild(s)
  toolBarLTContainer.className = 'lt'
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

export default function(mind) {
  mind.container.append(createToolBarRBContainer(mind))
  mind.container.append(createToolBarLTContainer(mind))
}
