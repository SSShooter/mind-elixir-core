// Polyfill for DOMRect as happy-dom and jsdom don't support it
export const domRect = (x = 0, y = 0, width = 0, height = 0): DOMRect => {
  const rect = { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height }
  const toJSON = () => JSON.stringify(rect)
  return { ...rect, toJSON }
}
