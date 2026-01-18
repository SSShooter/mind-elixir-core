import type { Theme } from '.'

export const LEFT = 0
export const RIGHT = 1
export const SIDE = 2
export const DOWN = 3

export const THEME: Theme = {
  name: 'Latte',
  type: 'light',
  palette: ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd'],
  cssVar: {
    '--node-gap-x': '30px',
    '--node-gap-y': '10px',
    '--main-gap-x': '65px',
    '--main-gap-y': '45px',
    '--root-radius': '30px',
    '--main-radius': '20px',
    '--root-color': '#ffffff',
    '--root-bgcolor': '#4c4f69',
    '--root-border-color': 'rgba(0, 0, 0, 0)',
    '--main-color': '#444446',
    '--main-bgcolor': '#ffffff',
    '--main-bgcolor-transparent': 'rgba(255, 255, 255, 0.8)',
    '--topic-padding': '3px',
    '--color': '#777777',
    '--bgcolor': '#f6f6f6',
    '--selected': '#4dc4ff',
    '--accent-color': '#e64553',
    '--panel-color': '#444446',
    '--panel-bgcolor': '#ffffff',
    '--panel-border-color': '#eaeaea',
    '--map-padding': '50px 80px',
  },
}

export const DARK_THEME: Theme = {
  name: 'Dark',
  type: 'dark',
  palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
  cssVar: {
    '--node-gap-x': '30px',
    '--node-gap-y': '10px',
    '--main-gap-x': '65px',
    '--main-gap-y': '45px',
    '--root-radius': '30px',
    '--main-radius': '20px',
    '--root-color': '#ffffff',
    '--root-bgcolor': '#2d3748',
    '--root-border-color': 'rgba(255, 255, 255, 0.1)',
    '--main-color': '#ffffff',
    '--main-bgcolor': '#4c4f69',
    '--main-bgcolor-transparent': 'rgba(76, 79, 105, 0.8)',
    '--topic-padding': '3px',
    '--color': '#cccccc',
    '--bgcolor': '#252526',
    '--selected': '#4dc4ff',
    '--accent-color': '#789AFA',
    '--panel-color': '#ffffff',
    '--panel-bgcolor': '#2d3748',
    '--panel-border-color': '#696969',
    '--map-padding': '50px 80px',
  },
}
