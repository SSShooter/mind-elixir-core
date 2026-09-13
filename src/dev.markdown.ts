/**
 * Shared markdown → HTML renderer for the dev entries.
 *
 * The map takes it as `Options.markdown`, the outliner as
 * `OutlinerOptions.markdown` — same function on both sides so the two views of
 * one dataset render identically (see dev.ts / dev.outliner.ts).
 *
 * KaTeX runs as a PRE-pass: marked would otherwise eat the LaTeX
 * (`_` becomes emphasis, `\\` becomes an escape).
 */
import katex from 'katex'
import type { Tokens } from 'marked'
import { marked } from 'marked'

/**
 * `**text**` / `__text__` render as `<strong>`; `%:color:text` inside the
 * emphasis picks an inline color. Class names match markdown.css
 * (`asterisk-emphasis` / `underscore-emphasis`), which supplies the fallback
 * color and the highlight background when no explicit color is given.
 */
const renderer = {
  strong(token: Tokens.Strong) {
    let color = ''
    let content = token.text
    if (token.text.startsWith('%:')) {
      const text = token.text.slice(2)
      const colonIndex = text.indexOf(':')
      if (colonIndex > 0) {
        color = text.slice(0, colonIndex)
        content = text.slice(colonIndex + 1)
      }
    }
    const underscore = token.raw.startsWith('__')
    const style = color ? ` style="${underscore ? 'background-color' : 'color'}: ${color};"` : ''
    return `<strong class="${underscore ? 'underscore-emphasis' : 'asterisk-emphasis'}"${style}>${content}</strong>`
  },
  link(token: Tokens.Link) {
    const href = token.href || ''
    const title = token.title ? ` title="${token.title}"` : ''
    const text = token.text || ''
    return `<a href="${href}"${title} target="_blank">${text}</a>`
  },
}

marked.use({ renderer, gfm: true })

const renderMath = (math: string, displayMode: boolean) => katex.renderToString(math.trim(), { displayMode, output: 'html' })

export function renderMarkdown(text: string): string {
  if (!text) return ''
  try {
    const withMath = text
      .replace(/\$\$([^$]+)\$\$/g, (_, math) => renderMath(math, true))
      .replace(/\$([^$]+)\$/g, (_, math) => renderMath(math, false))
    return (marked(withMath) as string).trim()
  } catch (error) {
    console.log('renderMarkdown error', error)
    return text
  }
}
