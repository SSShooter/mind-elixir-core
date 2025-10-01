import { arrayify } from './arrayify'

export type SelectAllSelectors = (string | Element)[] | string | Element

/**
 * Takes a selector (or array of selectors) and returns the matched nodes.
 * @param selector The selector or an Array of selectors.
 * @param doc
 * @returns {Array} Array of DOM-Nodes.
 */
export const selectAll = (selector: SelectAllSelectors, doc: Document = document): Element[] =>
  arrayify(selector)
    .map(item => (typeof item === 'string' ? Array.from(doc.querySelectorAll(item)) : item instanceof Element ? item : null))
    .flat()
    .filter(Boolean) as Element[]
