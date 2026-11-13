import { test, expect } from './mind-elixir-test'
import { removeNodeObj, moveNodeObj, isDescendantOrSelf } from '../src/utils/objectManipulation'
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

test('isDescendantOrSelf - detects self and subtree targets', () => {
  const main = node('main')
  const a = node('a')
  const b = node('b')
  main.children = [a]
  a.children = [b]
  a.parent = main
  b.parent = a

  expect(isDescendantOrSelf(a, a)).toBe(true)
  expect(isDescendantOrSelf(main, b)).toBe(true)
  // an ancestor is a LEGAL target: moving a child back under its parent is fine
  expect(isDescendantOrSelf(a, main)).toBe(false)
  expect(isDescendantOrSelf(b, a)).toBe(false)
})

test('moveNodeObj - moving a node into itself is rejected', () => {
  const main = node('main')
  const a = node('a')
  main.children = [a]
  a.parent = main

  moveNodeObj('in', a, a)

  // A used to be pushed into its own children — a cyclic tree that made
  // `fillParent` recurse forever and `getData` throw on circular JSON
  expect(main.children!.map(child => child.id)).toEqual(['a'])
  expect(a.children).toBeUndefined()
})

test('moveNodeObj - a rejected move is reported through the return value', () => {
  const main = node('main')
  const a = node('a')
  main.children = [a]
  a.parent = main

  expect(moveNodeObj('in', a, a)).toBe(false)
  expect(moveNodeObj('in', main, a)).toBe(false)
  expect(moveNodeObj('in', a, main)).toBe(true)
})

test('moveNodeObj - moving a node before/after itself is rejected', () => {
  const main = node('main')
  const a = node('a')
  const b = node('b')
  main.children = [a, b]
  a.parent = main
  b.parent = main

  moveNodeObj('before', a, a)
  moveNodeObj('after', b, b)

  // `indexOf` returned -1 after the removal and `splice(-1, 0, a)` used to
  // land the node on the LAST slot, silently demoting the previous sibling
  expect(main.children!.map(child => child.id)).toEqual(['a', 'b'])
})

test('moveNodeObj - moving a node into its own descendant is rejected', () => {
  const main = node('main')
  const a = node('a')
  const b = node('b')
  main.children = [a]
  a.children = [b]
  a.parent = main
  b.parent = a

  moveNodeObj('in', main, b)

  // main must not become a child of its own grandchild
  expect(main.children!.map(child => child.id)).toEqual(['a'])
  expect(b.children).toBeUndefined()
})

test('moveNodeObj - a normal move into a sibling still works', () => {
  const main = node('main')
  const a = node('a')
  const b = node('b')
  main.children = [a, b]
  a.parent = main
  b.parent = main

  // moveNodeObj only maintains the children arrays; parent pointers are
  // re-anchored by the caller's `fillParent`
  expect(moveNodeObj('in', a, b)).toBe(true)
  expect(main.children!.map(child => child.id)).toEqual(['b'])
  expect(b.children!.map(child => child.id)).toEqual(['a'])
})
