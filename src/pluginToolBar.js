let createButton = (id, name) => {
    let button = document.createElement('span')
    button.id = id
    button.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-${name}"></use>
  </svg>`
    return button
}

let toolBarRBContainer = document.createElement('toolbar')
let fc = createButton('fullscreen', 'full')
let gc = createButton('toCenter', 'living')
// gc.title = '居中'
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

// let help = createButton('helpme', 'help')
let infoContainer = document.createElement('toolbar')
// infoContainer.appendChild(help);
infoContainer.innerHTML = `
  <div class="button-container"><svg class="icon" aria-hidden="true">
  <use xlink:href="#icon-help"></use>
  </svg></div>
  `
infoContainer.className = 'im'
let buttonContainer = infoContainer.querySelector('.button-container')
// infoContainer.hidden = true

let infoSpan = createButton('span')
infoSpan.innerHTML = `
<div class = 'helpTittle'>
快捷键使用说明：
</div>
<div class = 'helpInfo'>
  编辑        (Mac 为 空格) </br>
  插入子节点   (Mac 为 Tab) </br>
  插入同级节点 (Mac 为 Enter) </br>
  删除节点     (Mac 为 Delete) </br>
  上移        (Mac 为 PgUp,Windows为pageup) </br>
  下移        (Mac 为 PgDn,Windows为pagedown) </br>
  克隆        (Mac 为 command + c) </br>
  redo        (Mac 为 command + z) </br>
  undo        (Mac 为 command + shift + z) </br>
  保存        (Mac 为 command + s) </br>
</div>
`
infoSpan.hidden =true
infoContainer.appendChild(infoSpan)


let toolBarLTContainer = document.createElement('toolbar')
let l = createButton('tbltl', 'left')
let r = createButton('tbltr', 'right')
let s = createButton('tblts', 'side')
// let d = createButton('zoomin', 'add')
toolBarLTContainer.appendChild(l)
toolBarLTContainer.appendChild(r)
toolBarLTContainer.appendChild(s)
toolBarLTContainer.className = 'lt'

export default function (mind) {
    let scale = 1
    mind.container.append(toolBarRBContainer)
    // mind.container.append(toolBarLTContainer)
    mind.container.append(infoContainer)


    
    let state = 'open'
    buttonContainer.onclick = e => {
    if (state === 'open') {
      state = 'close'
      infoContainer.className = 'im'
      buttonContainer.innerHTML = `
      <div class="button-container"><svg class="icon" aria-hidden="true">
      <use xlink:href="#icon-close"></use>
      </svg></div>
      `
      infoSpan.hidden = false
    } else {
      state = 'open'
      infoContainer.className = 'im'
      buttonContainer.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-help"></use>
    </svg>`
    infoSpan.hidden = true
    }
  }



    fc.onclick = () => {
        mind.container.requestFullscreen()
    }
    gc.onclick = () => {
        mind.toCenter()
    }
    zo.onclick = () => {
        if (scale < 0.6) return
        mind.scale(scale -= .2)
        // percentage.innerHTML = Math.round(scale * 100) + '%'
    }
    zi.onclick = () => {
        if (scale > 1.6) return
        mind.scale(scale += .2)
        // percentage.innerHTML = Math.round(scale * 100) + '%'
    }
    l.onclick = () => {
        mind.initLeft()
    }
    r.onclick = () => {
        mind.initRight()
    }
    s.onclick = () => {
        mind.initSide()
    }
}