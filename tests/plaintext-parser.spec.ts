import { test, expect } from './mind-elixir-test'
import { plaintextToMindElixir, type NodePlaintextMeta } from '../src/utils/plaintextToMindElixir'

test('Parse plaintext with MathJax and styles', () => {
  const plaintext = [
    '- Root Node',
    '  - $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$',
    '  - 勾股定理: $a^2 + b^2 = c^2$',
    '  - Child Node 3-3 [^id5] {"fontFamily": "Arial", "fontWeight": "bold"}',
    '  - Node with ID [^node-1]',
    '  - Node with style {"color": "red"}',
    '  - Edge case {2a} is not style',
  ].join('\n')

  const result = plaintextToMindElixir(plaintext)

  const children = result.nodeData.children!
  expect(children.length).toBe(6)

  // MathJax equation
  expect(children[0].topic).toBe('$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$')
  expect(children[0].style).toBeUndefined()

  // Chinese MathJax equation
  expect(children[1].topic).toBe('勾股定理: $a^2 + b^2 = c^2$')
  expect(children[1].style).toBeUndefined()

  // Node with refId and style
  expect(children[2].topic).toBe('Child Node 3-3')
  expect(children[2].style).toEqual({ fontFamily: 'Arial', fontWeight: 'bold' })
  expect((children[2].metadata as NodePlaintextMeta)?.refId).toBe('id5')

  // Node with ID
  expect(children[3].topic).toBe('Node with ID')
  expect((children[3].metadata as NodePlaintextMeta)?.refId).toBe('node-1')

  // Node with style
  expect(children[4].topic).toBe('Node with style')
  expect(children[4].style).toEqual({ color: 'red' })

  // Edge case
  expect(children[5].topic).toBe('Edge case {2a} is not style')
  expect(children[5].style).toBeUndefined()
})
