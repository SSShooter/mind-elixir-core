export const LEFT = 0
export const RIGHT = 1
export const SIDE = 2
export const DOWN = 3

export const GAP = 30 // must sync with --gap in index.less

export const TURNPOINT_R = 8
export const THEME = {
  name: 'Latte',
  palette: ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd'],
  cssVar: {
    '--main-color': '#444446',
    '--main-bgcolor': '#ffffff',
    '--color': '#777777',
    '--bgcolor': '#f6f6f6',
  },
}

export const DARK_THEME = {
  name: 'Dark',
  palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
  cssVar: {
    '--main-color': '#ffffff',
    '--main-bgcolor': '#4c4f69',
    '--color': '#cccccc',
    '--bgcolor': '#252526',
  },
}
