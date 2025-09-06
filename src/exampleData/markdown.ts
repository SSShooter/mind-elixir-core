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
  theme: {
    name: 'Latte',
    palette: ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd'],
    cssVar: {
      '--node-gap-x': '30px',
      '--node-gap-y': '10px',
      '--main-gap-x': '32px',
      '--main-gap-y': '12px',
      '--root-radius': '30px',
      '--main-radius': '20px',
      '--root-color': '#ffffff',
      '--root-bgcolor': '#4c4f69',
      '--root-border-color': 'rgba(0, 0, 0, 0)',
      '--main-color': '#444446',
      '--main-bgcolor': '#ffffff',
      '--topic-padding': '3px',
      '--color': '#777777',
      '--bgcolor': '#f6f6f6',
      '--selected': '#4dc4ff',
      '--panel-color': '#444446',
      '--panel-bgcolor': '#ffffff',
      '--panel-border-color': '#eaeaea',
      '--map-padding': '50px 80px',
    },
  },
}

export default markdownExample
