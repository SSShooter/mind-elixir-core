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
  const keys = Object.keys(cssVar)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as keyof typeof cssVar
    this.container.style.setProperty(key, cssVar[key] as string)
  }
  if (!theme.cssVar['--gap']) {
    this.container.style.setProperty('--gap', '30px')
  }
  shouldRefresh && this.refresh()
}
