import { test, expect } from './mind-elixir-test'
import { removeNodeObj } from '../src/utils/objectManipulation'
import type { NodeObj } from '../src/types'

const node = (id: string) => ({ id, topic: id }) as NodeObj

test('removeNodeObj - a drifted parent pointer does not drop the last sibling', () => {
  const root = node('root')
  const main = node('main')
  const a = node('a')
  const b = node('b')
  root.children = [main]
  main.children = [a, b]
  main.parent = root
  a.parent = main
  b.parent = main

  // The tree drifted out of sync: `a` claims `root` as its parent while
  // `main.children` still holds it, so `indexOf` returns -1.
  a.parent = root

  removeNodeObj(a)

  // `splice(-1, 1)` used to take out the LAST sibling — here `main`, quietly
  // deleting an unrelated subtree along with it.
  expect(root.children.map(child => child.id)).toEqual(['main'])
  expect(main.children!.map(child => child.id)).toEqual(['a', 'b'])
})

test('removeNodeObj - removes the node in the normal case', () => {
  const main = node('main')
  const a = node('a')
  const b = node('b')
  main.children = [a, b]
  a.parent = main
  b.parent = main

  expect(removeNodeObj(a)).toBe(1)
  expect(main.children.map(child => child.id)).toEqual(['b'])
})
