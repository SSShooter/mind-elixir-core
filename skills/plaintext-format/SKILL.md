---
name: Mind Elixir Plaintext Format
description: Guide for understanding and converting Mind Elixir plaintext format. Covers format specification, parsing, and conversion to Mind Elixir data structure.
---

# Mind Elixir Plaintext Format

This skill explains the Mind Elixir plaintext format specification and how to convert it to the Mind Elixir JSON data structure. The plaintext format is ideal for human editing, AI generation, and streaming scenarios.

## 1. Format Overview

The plaintext format uses indentation-based syntax similar to Markdown lists. Each line represents a node in the mind map, and indentation (2 spaces per level) defines the hierarchy.

### Basic Structure

```text
- Root Node
  - Child Node 1
    - Child Node 1-1
    - Child Node 1-2
  - Child Node 2
    - Child Node 2-1
```

**Key Rules:**

- Root node starts with `-` (dash followed by space)
- Each child is indented by 2 spaces relative to its parent
- Each node line starts with `-` followed by a space and the topic text

## 2. Advanced Features

### 2.1 Node References (IDs)

Assign custom IDs to nodes for cross-referencing using `[^id]` syntax:

```text
- Root
  - Node A [^id1]
  - Node B [^id2]
```

**Format:** `[^customId]` at the end of the topic text.

### 2.2 Node Links

Create connections between nodes using the `>` prefix and arrow syntax:

#### Bidirectional Links

```text
- Root
  - Node A [^id1]
  - Node B [^id2]
  - > [^id1] <-Link Label-> [^id2]
```

**Format:** `> [^sourceId] <-Label-> [^targetId]`

#### Unidirectional Links

```text
- Root
  - Node A [^id1]
  - Node B [^id2]
  - > [^id1] >-Forward Link-> [^id2]
  - > [^id2] <-Backward Link-< [^id1]
```

**Formats:**

- Forward: `> [^sourceId] >-Label-> [^targetId]`
- Backward: `> [^sourceId] <-Label-< [^targetId]`

### 2.3 Node Styling

Apply inline styles using JSON-like syntax:

```text
- Root
  - Styled Node {color: #e87a90}
  - Another Node {color: #3298db, background: #ecf0f1}
```

**Format:** `{property: value, property2: value2}` at the end of the topic text.

**Common Properties:**

- `color`: Text color (hex code)
- `background`: Background color (hex code)
- `fontSize`: Font size (number as string, e.g., "16")

### 2.4 Summary Nodes

Create summary nodes that visually group previous siblings:

```text
- Root
  - Node 1
  - Node 2
  - Node 3
  - } Summary of all above nodes
```

**Formats:**

- `} Summary text` - Summarizes all previous siblings
- `}:N Summary text` - Summarizes the previous N siblings (e.g., `}:2` for last 2 nodes)

```text
- Root
  - Node 1
  - Node 2
  - Node 3
  - }:2 Summary of Node 2 and Node 3
```

### 2.5 Complete Example

```text
- Project Planning
  - Phase 1: Research [^phase1]
    - Market Analysis {color: #3298db}
    - Competitor Study {color: #3298db}
    - }:2 Research Summary
  - Phase 2: Development [^phase2]
    - Frontend {color: #2ecc71}
    - Backend {color: #2ecc71}
    - Testing {color: #f39c12}
    - } Development Summary
  - Phase 3: Launch [^phase3]
    - Marketing
    - Deployment
  - > [^phase1] >-Leads to-> [^phase2]
  - > [^phase2] >-Leads to-> [^phase3]
```

## 3. Converting Plaintext to Mind Elixir Data

### 3.1 Using the Built-in Converter

Mind Elixir provides a built-in converter for plaintext format:

```javascript
import { plaintextToMindElixir } from 'mind-elixir/plaintextConverter'

const plaintext = `
- Root Node
  - Child 1
  - Child 2
`

const mindElixirData = plaintextToMindElixir(plaintext)
// Returns MindElixirData object ready for mind.init() or mind.refresh()
```

### 3.2 Integration Example

```javascript
import MindElixir from 'mind-elixir'
import { plaintextToMindElixir } from 'mind-elixir/plaintextConverter'

// 1. Parse plaintext
const plaintext = `
- My Mind Map
  - Topic 1
    - Subtopic 1.1
    - Subtopic 1.2
  - Topic 2
`

const data = plaintextToMindElixir(plaintext)

// 2. Initialize Mind Elixir
const mind = new MindElixir({
  el: '#map',
  direction: MindElixir.RIGHT,
})

mind.init(data)
```

## 4. Use Cases

### 4.1 AI-Generated Mind Maps

The plaintext format is ideal for LLM generation:

```javascript
// Prompt example for AI
const prompt = `
Generate a mind map in plaintext format about "Web Development".
Use this format:
- Root Topic
  - Subtopic 1
    - Detail 1.1
  - Subtopic 2
`

// Then parse the AI response
const aiResponse = await callAI(prompt)
const data = plaintextToMindElixir(aiResponse)
mind.refresh(data)
```

### 4.2 File-Based Mind Maps

Store mind maps as `.txt` or `.md` files:

```javascript
// Load from file
const response = await fetch('/mindmaps/project.txt')
const plaintext = await response.text()
const data = plaintextToMindElixir(plaintext)
mind.init(data)
```

### 4.3 Collaborative Editing

The plaintext format is merge-friendly for version control:

```bash
# Easy to diff and merge in Git
git diff mindmap.txt
```

## 5. Error Handling

Always wrap parsing in try-catch blocks:

```javascript
function safeParse(plaintext: string): MindElixirData | null {
  try {
    return plaintextToMindElixir(plaintext)
  } catch (error) {
    console.error('Parse error:', error)
    // Return fallback data
    return {
      nodeData: {
        id: 'root',
        topic: 'Parse Error',
        children: []
      }
    }
  }
}
```

## 6. Best Practices

1. **Consistent Indentation**: Always use 2 spaces per level
2. **Unique IDs**: When using references, ensure IDs are unique within the document
3. **Link Placement**: Links can be placed anywhere, but keep them near related nodes for readability
4. **Validation**: Validate plaintext before parsing, especially for user input
5. **Streaming**: For streaming scenarios, parse incrementally and handle partial data gracefully

## 7. Format Specification Summary

| Feature            | Syntax                      | Example                    |
| ------------------ | --------------------------- | -------------------------- |
| Node               | `- Topic`                   | `- My Node`                |
| Node with ID       | `- Topic [^id]`             | `- Node A [^id1]`          |
| Node with Style    | `- Topic {prop: value}`     | `- Node {color: #ff0000}`  |
| Bidirectional Link | `> [^id1] <-Label-> [^id2]` | `> [^a] <-connects-> [^b]` |
| Forward Link       | `> [^id1] >-Label-> [^id2]` | `> [^a] >-leads to-> [^b]` |
| Backward Link      | `> [^id1] <-Label-< [^id2]` | `> [^a] <-from-< [^b]`     |
| Summary (all)      | `} Summary text`            | `} Overview`               |
| Summary (N nodes)  | `}:N Summary text`          | `}:3 Last three items`     |

## 8. TypeScript Types

```typescript
import type { MindElixirData, NodeObj } from 'mind-elixir'

// Converter function type
function plaintextToMindElixir(plaintext: string): MindElixirData
```
