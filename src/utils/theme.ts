import { DARK_THEME, THEME } from '../const'
import type { MindElixirInstance } from '../types/index'
import type { Theme } from '../types/index'

export const changeTheme = function (this: MindElixirInstance, theme: Theme, shouldRefresh = true) {
  this.theme = theme
  const base = theme.type === 'dark' ? DARK_THEME : THEME
  const cssVar = {
    ...base.cssVar,
    ...theme.cssVar,
  }
  if (this.compact) {
    cssVar['--node-gap-x'] = '15px'
    cssVar['--node-gap-y'] = '2px'
    cssVar['--main-gap-x'] = '30px'
    cssVar['--main-gap-y'] = '6px'
  }
  const keys = Object.keys(cssVar)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as keyof typeof cssVar
    this.container.style.setProperty(key, cssVar[key] as string)
  }
  shouldRefresh && this.refresh()
}

export const changeCompact = function (this: MindElixirInstance, compact: boolean) {
  this.compact = compact
  if (this.theme) {
    this.changeTheme(this.theme)
  }
}
