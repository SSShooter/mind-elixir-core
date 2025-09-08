import type { MindElixirData } from '../index'

/**
 * Markdown test example data
 * This example demonstrates various markdown syntax features
 * that can be rendered in Mind Elixir nodes
 */
const markdownExample: MindElixirData = {
  nodeData: {
    id: 'markdown-root',
    topic: 'Markdown Examples',
    children: [
      {
        topic: '**Text Formatting**',
        id: 'markdown-formatting',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'This is **bold** text',
            id: 'markdown-bold',
          },
          {
            topic: 'This is *italic* text',
            id: 'markdown-italic',
          },
          {
            topic: 'This is ***bold and italic*** text',
            id: 'markdown-bold-italic',
          },
          {
            topic: '**Important**: *Always* use proper formatting',
            id: 'markdown-mixed-format',
          },
        ],
      },
      {
        topic: '`Code Examples`',
        id: 'markdown-code',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Inline code: `console.log("Hello World")`',
            id: 'markdown-inline-code',
          },
          {
            topic: 'Variable: `const name = "Mind Elixir"`',
            id: 'markdown-variable',
          },
          {
            topic: 'Function: `function add(a, b) { return a + b; }`',
            id: 'markdown-function',
          },
          {
            topic: 'Install package: `npm install mind-elixir`',
            id: 'markdown-command',
          },
        ],
      },
      {
        topic: 'Links and References',
        id: 'markdown-links',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Visit [GitHub](https://github.com) for repositories',
            id: 'markdown-github-link',
          },
          {
            topic: 'Check out [Mind Elixir](https://github.com/ssshooter/mind-elixir-core)',
            id: 'markdown-project-link',
          },
          {
            topic: 'Documentation: [MDN Web Docs](https://developer.mozilla.org)',
            id: 'markdown-docs-link',
          },
          {
            topic: 'Learn more at [TypeScript](https://www.typescriptlang.org/)',
            id: 'markdown-typescript-link',
          },
        ],
      },
      {
        topic: 'Mixed Content Examples',
        id: 'markdown-mixed',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '**Important**: Use `npm install` to install packages',
            id: 'markdown-mixed-1',
          },
          {
            topic: '*Note*: Check [documentation](https://docs.npmjs.com) for details',
            id: 'markdown-mixed-2',
          },
          {
            topic: 'Run `npm start` to **start** the *development* server',
            id: 'markdown-mixed-3',
          },
          {
            topic: '**Pro tip**: Use `git commit -m "message"` for [version control](https://git-scm.com)',
            id: 'markdown-mixed-4',
          },
        ],
      },
      {
        topic: 'Development Workflow',
        id: 'markdown-workflow',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: '**Step 1**: Clone the [repository](https://github.com/ssshooter/mind-elixir-core)',
            id: 'markdown-step-1',
          },
          {
            topic: '**Step 2**: Run `npm install` to install *dependencies*',
            id: 'markdown-step-2',
          },
          {
            topic: '**Step 3**: Use `npm run dev` to start **development** mode',
            id: 'markdown-step-3',
          },
          {
            topic: '**Step 4**: Edit files and see *live* changes',
            id: 'markdown-step-4',
          },
        ],
      },
      {
        topic: 'Mathematical Formulas (KaTeX)',
        id: 'markdown-katex',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: "Einstein's equation: $E = mc^2$",
            id: 'markdown-katex-einstein',
          },
          {
            topic: 'Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
            id: 'markdown-katex-quadratic',
          },
          {
            topic: 'Integral: $$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$',
            id: 'markdown-katex-integral',
          },
          {
            topic: 'Matrix: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$',
            id: 'markdown-katex-matrix',
          },
          {
            topic: 'Summation: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$',
            id: 'markdown-katex-sum',
          },
          {
            topic: 'Limit: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$',
            id: 'markdown-katex-limit',
          },
        ],
      },
      {
        topic: 'Complex Mathematical Examples',
        id: 'markdown-complex-math',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Normal distribution: $$f(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$',
            id: 'markdown-normal-dist',
          },
          {
            topic: 'Fourier transform: $$F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} dt$$',
            id: 'markdown-fourier',
          },
          {
            topic: 'Taylor series: $$f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n$$',
            id: 'markdown-taylor',
          },
          {
            topic: 'Schrödinger equation: $$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$',
            id: 'markdown-schrodinger',
          },
        ],
      },
      {
        topic: 'API Examples',
        id: 'markdown-api',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Create instance: `new MindElixir(options)`',
            id: 'markdown-api-create',
          },
          {
            topic: 'Initialize: `mind.init(data)`',
            id: 'markdown-api-init',
          },
          {
            topic: 'Add child: `mind.addChild(node)`',
            id: 'markdown-api-add',
          },
          {
            topic: 'Export data: `mind.getData()`',
            id: 'markdown-api-export',
          },
        ],
      },
    ],
    expanded: true,
  },
  direction: 2,
}

export default markdownExample
