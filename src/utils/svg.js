let $d = document
export let createMainPath = function (d) {
  let path = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', '#666')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-width', '2')
  return path
}

export let createLinkSvg = function (klass) {
  let svg = $d.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', klass)
  return svg
}

export let createLine = function (x1, y1, x2, y2) {
  let line = $d.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', x1)
  line.setAttribute('y1', y1)
  line.setAttribute('x2', x2)
  line.setAttribute('y2', y2)
  line.setAttribute('stroke', '#bbb')
  line.setAttribute('fill', 'none')
  line.setAttribute('stroke-width', '2')
  return line
}

export let createPath = function (d) {
  let path = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', '#555')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-linecap', 'square')
  path.setAttribute('stroke-width', '1')
  path.setAttribute('transform', 'translate(0.5,-0.5)')
  // adding translate(0.5,-0.5) can fix render error on windows, but i still dunno why
  return path
}

export let createSvgGroup = function (d, arrowd) {
  let g = $d.createElementNS('http://www.w3.org/2000/svg', 'g')
  let path = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  let arrow = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  arrow.setAttribute('d', arrowd)
  arrow.setAttribute('stroke', 'rgb(235, 95, 82)')
  arrow.setAttribute('fill', 'none')
  arrow.setAttribute('stroke-linecap', 'cap')
  arrow.setAttribute('stroke-width', '2')
  path.setAttribute('d', d)
  path.setAttribute('stroke', 'rgb(235, 95, 82)')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-linecap', 'cap')
  path.setAttribute('stroke-width', '2')

  g.appendChild(path)
  g.appendChild(arrow)
  return g
}
