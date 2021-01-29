let createButton = (id, name) => {
  let button = document.createElement('span')
  button.id = id
  button.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-${name}"></use>
  </svg>`
  return button
}

function createToolBarRBContainer(mind) {
  let toolBarRBContainer = document.createElement('toolbar')
  let fc = createButton('fullscreen', 'full')
  let gc = createButton('toCenter', 'living')
  let zo = createButton('zoomout', 'move')
  let zi = createButton('zoomin', 'add')
  let percentage = document.createElement('span')
  percentage.innerHTML = '100%'
  toolBarRBContainer.appendChild(fc)
  toolBarRBContainer.appendChild(gc)
  toolBarRBContainer.appendChild(zo)
  toolBarRBContainer.appendChild(zi)
  // toolBarRBContainer.appendChild(percentage)
  toolBarRBContainer.className = 'rb'
  fc.onclick = () => {
    // when full screen mode is on, change the bg color;
    mind.mindElixirBox.style.background = "#fff";

    // Make element in full screen mode
    mind.mindElixirBox.requestFullscreen()
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

  document.addEventListener('fullscreenchange', (event) => {
    // Reset the transform scale
    mind.mindElixirBox.querySelector(".map-canvas").style.transform = "scale(1)";

    // Reset the map's position
    mind.toCenter();
  });

  return toolBarRBContainer
}
function createToolBarLTContainer(mind) {
  let toolBarLTContainer = document.createElement('toolbar')
  let l = createButton('tbltl', 'left')
  let r = createButton('tbltr', 'right')
  let s = createButton('tblts', 'side')

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

export default function (mind) {
  mind.container.append(createToolBarRBContainer(mind))
  mind.container.append(createToolBarLTContainer(mind))
}
