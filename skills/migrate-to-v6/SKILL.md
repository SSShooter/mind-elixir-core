---
name: Migrate to Mind Elixir v6
description: How to migrate consumer code from Mind Elixir v5 to v6.
---

# Migrate to Mind Elixir v6

Update the following usages when migrating from v5 to v6.

## 1. DOM selectors

Inner map elements are now `<div>` elements. Replace tag selectors with class selectors:

```diff
- me-tpc { ... }
+ .me-tpc { ... }

- map.querySelector('me-tpc')
+ map.querySelector('.me-tpc')
```

The affected elements are `me-main`, `me-wrapper`, `me-parent`, `me-children`, `me-tpc`, `me-epd`, `me-nodes`, and `me-root`. For direction checks, use classes such as `.me-main.lhs`, `.me-main.rhs`, and `.me-main.down`.

## 2. Copying nodes

```diff
- mind.copyNode(node, to)
+ mind.copyNodes([node], to)
```

The operation name is also `copyNodes`.

## 3. Moving nodes

```diff
- mind.moveNodeIn(nodes, to)
+ mind.moveNodesIn(nodes, to)

- mind.moveNodeBefore(nodes, to)
+ mind.moveNodesBefore(nodes, to)

- mind.moveNodeAfter(nodes, to)
+ mind.moveNodesAfter(nodes, to)
```

Update operation listeners to use the plural names. Existing `addListener` usage does not otherwise change. `moveUpNode` and `moveDownNode` are unchanged.

## 4. Operation payloads

Update operation listeners as follows:

| v5 | v6 |
| --- | --- |
| `operation.obj` | `operation.target` |
| `operation.objs` | `operation.target` |
| `operation.toObj` | `operation.destination` |
| `operation.type` for `insertSibling` | `operation.position` |

`operation.target` is an object for single-target operations and an array for batch node operations.

```diff
- if (operation.name === 'addChild') console.log(operation.obj)
+ if (operation.name === 'addChild') console.log(operation.target)

- if (operation.name === 'copyNodes') console.log(operation.objs)
+ if (operation.name === 'copyNodes') console.log(operation.target)

- if (['moveNodesIn', 'moveNodesBefore', 'moveNodesAfter'].includes(operation.name)) {
-   console.log(operation.objs, operation.toObj)
- }
+ if (['moveNodesIn', 'moveNodesBefore', 'moveNodesAfter'].includes(operation.name)) {
+   console.log(operation.target, operation.destination)
+ }
```

## 5. TypeScript generics (breaking change)

`MindElixirInstance` and `MindElixirCtor` were removed. Use `MindElixir<M>` directly, and pass custom metadata types through related types:

```diff
- const mind: MindElixirInstance = new MindElixir(options)
+ const mind = new MindElixir<Metadata>(options)
```

For constructor annotations, use `typeof MindElixir` instead of `MindElixirCtor`.

## 6. lite build

If you reference the lite build file directly:

```diff
- MindElixirLite.iife.js
+ MindElixirLite.js
```

The `mind-elixir/lite` import remains unchanged.

## 7. `expandNode` bus event removed (breaking change)

The standalone `expandNode` event on `mind.bus` was removed. Folding and expanding are data mutations and are now reported exclusively through the `operation` event with name `'expandNode'` or `'collapseNode'`:

```diff
- mind.bus.addListener('expandNode', node => {
-   console.log('expandNode: ', node)
- })
+ mind.bus.addListener('operation', op => {
+   if (op.name === 'expandNode' || op.name === 'collapseNode') {
+     console.log('node: ', op.target)
+     console.log('silent: ', op.silent)
+   }
+ })
```

- `operation.target` is the folded `NodeObj`.
- `operation.silent` is `true` if the fold was an internal silent expand (e.g. auto-expanding a collapsed parent before adding a child) or called with `{ silent: true }`. Silent operations do not create entries on the undo stack.

