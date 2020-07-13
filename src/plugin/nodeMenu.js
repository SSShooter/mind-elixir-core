import i18n from '../i18n'

export default function(mind) {
  let locale = i18n[mind.locale] ? mind.locale : 'en'
  let createDiv = (id, name) => {
    let div = document.createElement('div')
    div.id = id
    div.innerHTML = `<span>${name}</span>`
    return div
  }
  let bgOrFont
  let styleDiv = createDiv('nm-style', 'style')
  let tagDiv = createDiv('nm-tag', 'tag')
  let iconDiv = createDiv('nm-icon', 'icon')

  let colorList = [
    '#2c3e50',
    '#34495e',
    '#7f8c8d',
    '#94a5a6',
    '#bdc3c7',
    '#ecf0f1',
    '#8e44ad',
    '#9b59b6',
    '#2980b9',
    '#3298db',
    '#c0392c',
    '#e74c3c',
    '#d35400',
    '#f39c11',
    '#f1c40e',
    '#17a085',
    '#27ae61',
    '#2ecc71',
  ]
  styleDiv.innerHTML = `
      <div class="nm-fontsize-container">
        ${['15', '24', '32']
          .map(size => {
            return `<div class="size"  data-size="${size}">
        <svg class="icon" style="width: ${size}px;height: ${size}px" aria-hidden="true">
          <use xlink:href="#icon-a"></use>
        </svg></div>`
          })
          .join('')}<div class="bold"><svg class="icon" aria-hidden="true">
  <use xlink:href="#icon-B"></use>
  </svg></div>
      </div>
      <div class="nm-fontcolor-container">
        ${colorList
          .map(color => {
            return `<div class="split6"><div class="palette" data-color="${color}" style="background-color: ${color};"></div></div>`
          })
          .join('')}
      </div>
      <div class="bof">
      <span class="font">${i18n[locale].font}</span>
      <span class="background">${i18n[locale].background}</span>
      </div>
  `
  tagDiv.innerHTML = `
      ${i18n[locale].tag}<input class="nm-tag" tabindex="-1" placeholder="${
    i18n[locale].tagsSeparate
  }" /><br>
  `
  iconDiv.innerHTML = `
      ${i18n[locale].icon}<input class="nm-icon" tabindex="-1" placeholder="${
    i18n[locale].iconsSeparate
  }" /><br>
  `

  let menuContainer = document.createElement('nmenu')
  menuContainer.innerHTML = `
  <div class="button-container"><svg class="icon" aria-hidden="true">
  <use xlink:href="#icon-close"></use>
  </svg></div>
  `
  menuContainer.appendChild(styleDiv)
  menuContainer.appendChild(tagDiv)
  menuContainer.appendChild(iconDiv)
  menuContainer.hidden = true

  function clearSelect(klass, remove) {
    var elems = document.querySelectorAll(klass)
    ;[].forEach.call(elems, function(el) {
      el.classList.remove(remove)
    })
  }

  mind.container.append(menuContainer)
  let sizeSelector = menuContainer.querySelectorAll('.size')
  let bold = menuContainer.querySelector('.bold')
  let buttonContainer = menuContainer.querySelector('.button-container')
  let fontBtn = menuContainer.querySelector('.font')
  let tagInput = document.querySelector('.nm-tag')
  let iconInput = document.querySelector('.nm-icon')
  menuContainer.onclick = e => {
    if (!mind.currentNode) return
    let nodeObj = mind.currentNode.nodeObj
    if (e.target.className === 'palette') {
      if (!nodeObj.style) nodeObj.style = {}
      clearSelect('.palette', 'nmenu-selected')
      e.target.className = 'palette nmenu-selected'
      if (bgOrFont === 'font') {
        nodeObj.style.color = e.target.dataset.color
      } else if (bgOrFont === 'background') {
        nodeObj.style.background = e.target.dataset.color
      }
      mind.updateNodeStyle(nodeObj)
    } else if (e.target.className === 'background') {
      clearSelect('.palette', 'nmenu-selected')
      bgOrFont = 'background'
      e.target.className = 'background selected'
      e.target.previousElementSibling.className = 'font'
      if (nodeObj.style && nodeObj.style.background)
        menuContainer.querySelector(
          '.palette[data-color="' + nodeObj.style.background + '"]'
        ).className = 'palette nmenu-selected'
    } else if (e.target.className === 'font') {
      clearSelect('.palette', 'nmenu-selected')
      bgOrFont = 'font'
      e.target.className = 'font selected'
      e.target.nextElementSibling.className = 'background'
      if (nodeObj.style && nodeObj.style.color)
        menuContainer.querySelector(
          '.palette[data-color="' + nodeObj.style.color + '"]'
        ).className = 'palette nmenu-selected'
    }
  }
  Array.from(sizeSelector).map(
    dom =>
      (dom.onclick = e => {
        if (!mind.currentNode.nodeObj.style) mind.currentNode.nodeObj.style = {}
        clearSelect('.size', 'size-selected')
        let size = e.currentTarget
        mind.currentNode.nodeObj.style.fontSize = size.dataset.size
        size.className = 'size size-selected'
        mind.updateNodeStyle(mind.currentNode.nodeObj)
      })
  )
  bold.onclick = e => {
    if (!mind.currentNode.nodeObj.style) mind.currentNode.nodeObj.style = {}
    if (mind.currentNode.nodeObj.style.fontWeight === 'bold') {
      delete mind.currentNode.nodeObj.style.fontWeight
      e.currentTarget.className = 'bold'
      mind.updateNodeStyle(mind.currentNode.nodeObj)
    } else {
      mind.currentNode.nodeObj.style.fontWeight = 'bold'
      e.currentTarget.className = 'bold size-selected'
      mind.updateNodeStyle(mind.currentNode.nodeObj)
    }
  }
  tagInput.onchange = e => {
    if (!mind.currentNode) return
    if (!e.target.value) {
      mind.currentNode.nodeObj.tags = []
    } else {
      mind.currentNode.nodeObj.tags = e.target.value.split(',')
    }
    mind.updateNodeTags(mind.currentNode.nodeObj)
  }
  iconInput.onchange = e => {
    if (!mind.currentNode) return
    mind.currentNode.nodeObj.icons = e.target.value.split(',')
    mind.updateNodeIcons(mind.currentNode.nodeObj)
  }
  let state = 'open'
  buttonContainer.onclick = e => {
    if (state === 'open') {
      state = 'close'
      menuContainer.className = 'close'
      buttonContainer.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-menu"></use>
    </svg>`
    } else {
      state = 'open'
      menuContainer.className = ''
      buttonContainer.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-close"></use>
    </svg>`
    }
  }
  mind.bus.addListener('unselectNode', function() {
    menuContainer.hidden = true
  })
  mind.bus.addListener('selectNode', function(nodeObj) {
    menuContainer.hidden = false
    clearSelect('.palette', 'nmenu-selected')
    clearSelect('.size', 'size-selected')
    clearSelect('.bold', 'size-selected')
    bgOrFont = 'font'
    fontBtn.className = 'font selected'
    fontBtn.nextElementSibling.className = 'background'
    if (nodeObj.style) {
      if (nodeObj.style.fontSize)
        menuContainer.querySelector(
          '.size[data-size="' + nodeObj.style.fontSize + '"]'
        ).className = 'size size-selected'
      if (nodeObj.style.fontWeight)
        menuContainer.querySelector('.bold').className = 'bold size-selected'
      if (nodeObj.style.color)
        menuContainer.querySelector(
          '.palette[data-color="' + nodeObj.style.color + '"]'
        ).className = 'palette nmenu-selected'
    }
    if (nodeObj.tags) {
      tagInput.value = nodeObj.tags.join(',')
    } else {
      tagInput.value = ''
    }
    if (nodeObj.icons) {
      iconInput.value = nodeObj.icons.join(',')
    } else {
      iconInput.value = ''
    }
  })
}
