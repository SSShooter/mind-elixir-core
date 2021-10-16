// WIP
export function pieChart(data) {
  const cx = 45 // circle center
  const cy = 45
  const r = 35 // radius
  const lx = 105 // description position
  const ly = 15
  const svgns = 'http://www.w3.org/2000/svg'
  const colors = [
    '#004c6d',
    '#346888',
    '#5886a5',
    '#7aa6c2',
    '#9dc6e0',
    '#c1e7ff',
  ]
  // create <svg /> with specific width and height
  const chart = document.createElementNS(svgns, 'svg:svg')
  chart.setAttribute('width', 160)
  chart.setAttribute('height', 90)
  // chart.setAttribute("viewBox", "0 0 " + width + " " + height);
  chart.setAttribute('style', 'display:block;')

  let total = 0
  for (let i = 0; i < data.length; i++) {
    total += data[i].value
  }

  const angles = []
  for (let i = 0; i < data.length; i++) {
    angles[i] = (data[i].value / total) * Math.PI * 2
  }

  let starttangle = 0
  for (let i = 0; i < data.length; i++) {
    const endangle = starttangle + angles[i]

    const x1 = cx + r * Math.sin(starttangle)
    const y1 = cy - r * Math.cos(starttangle)
    const x2 = cx + r * Math.sin(endangle)
    const y2 = cy - r * Math.cos(endangle)

    const path = document.createElementNS(svgns, 'path')

    const d = `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 0 1 ${x2},${y2} Z`

    path.setAttribute('d', d)
    path.setAttribute('fill', colors[i])
    chart.appendChild(path)

    starttangle = endangle

    // description
    const icon = document.createElementNS(svgns, 'rect')
    icon.setAttribute('x', lx)
    icon.setAttribute('y', ly + 15 * i)
    icon.setAttribute('width', 10)
    icon.setAttribute('height', 10)
    icon.setAttribute('fill', colors[i])
    chart.appendChild(icon)

    const label = document.createElementNS(svgns, 'text')
    label.setAttribute('x', lx + 50)
    label.setAttribute('y', ly + 15 * i + 10)
    label.setAttribute('font-family', 'sans-serif')
    label.setAttribute('font-size', '14')
    label.appendChild(document.createTextNode(data[i].label))
    chart.appendChild(label)
  }
  return chart
}

// svg style
// background-color: #fff;
// padding: 5px;
// border-radius: 5px;
// border: 1px solid #ccc;

// example
if (nodeObj.pie) {
  const pieContainer = $d.createElement('div')
  pieContainer.className = 'pie'
  const pieData = [
    {
      value: 12,
      label: 'a',
    },
    {
      value: 15,
      label: 'b',
    },
    {
      value: 42,
      label: 'c',
    },
    {
      value: 33,
      label: 'd',
    },
  ]
  pieContainer.appendChild(pieChart(pieData))
  tpc.appendChild(pieContainer)
}
