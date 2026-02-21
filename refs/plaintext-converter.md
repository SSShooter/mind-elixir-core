# Plaintext ↔ MindElixir 双向转换逻辑说明

本文档描述 `src/utils/plaintextConverter.ts` 中 plaintext 与 MindElixir 数据结构之间的双向转换逻辑。

---

## 1. Plaintext 格式规范

Plaintext 格式是一种基于缩进的纯文本表示法，用来描述思维导图的树形结构、箭头连接和 Summary。

### 1.1 基本结构

```
- Root Node
  - Child 1
    - Grandchild 1-1
    - Grandchild 1-2
  - Child 2
```

- 每行以 `- ` 开头，表示一个节点
- **缩进**决定层级关系（每级 2 个空格）
- 缩进更深的行是前一个较浅行的子节点

### 1.2 节点的可选附加信息

一行中节点文本之后可以附加两种可选信息：

#### 引用 ID `[^refId]`

```
- Node A [^my-ref]
```

- 格式: `[^alphanumeric-or-dash]`
- 用途: 为节点创建一个引用标识符，供 Arrow 行引用
- 解析时存储到 `node.metadata.refId`
- 只有被箭头引用的节点或需要从箭头指向的节点才需要 refId

#### 样式对象 `{JSON}`

```
- Styled Node {"color": "#e87a90", "fontSize": "18px"}
```

- 格式: JSON 对象，支持的 key 包括 `fontSize`, `fontFamily`, `color`, `background`, `fontWeight` 等（即 `NodeObj.style` 的字段）
- 解析时存储到 `node.style`

#### 两者可组合使用

```
- Node [^id1] {"fontWeight": "bold"}
```

解析顺序: 先提取 `[^refId]`，再提取 `{style}`，剩余内容作为 `topic`。

### 1.3 Arrow（箭头连接）

Arrow 行描述两个节点之间的连接关系，以 `> ` 开头：

```
- > [^fromId] <-label-> [^toId]    # 双向连接
- > [^fromId] >-label-> [^toId]    # 单向连接（from → to）
```

**两种连接符格式：**

| 语法        | 含义             | 解析结果                                   |
| ----------- | ---------------- | ------------------------------------------ |
| `<-label->` | 双向             | `{ from, to, label, bidirectional: true }` |
| `>-label->` | 正向 (from → to) | `{ from, to, label }`                      |

- Arrow 行的**缩进位置**决定它在序列化时归属于哪个父节点
- Arrow 行可以出现在树内任意位置（作为某个节点的子项列表中的元素），也可出现在顶层（根节点之后）

### 1.4 Summary（概括）

Summary 行描述对一组兄弟节点的概括，以 `}` 开头：

```
- Parent
  - Child A
  - Child B
  - Child C
  - }:2 Summary text     # 概括前 2 个节点 (Child B, Child C)
  - } Summary text        # 概括所有已出现的兄弟节点 (Child A, B, C)
```

**格式说明：**

| 语法        | 含义                               |
| ----------- | ---------------------------------- |
| `}:N label` | 概括**当前位置往前** N 个兄弟节点  |
| `} label`   | 概括当前位置之前的**所有**兄弟节点 |

### 1.5 完整示例

```
- Root Node
  - Child Node 1
    - Child Node 1-1 {"color": "#e87a90", "fontSize": "18px"}
    - Child Node 1-2
    - Child Node 1-3
    - }:2 Summary of first two nodes
  - Child Node 2
    - Child Node 2-1 [^node-2-1]
    - Child Node 2-2 [^id2]
    - Child Node 2-3
    - > [^node-2-1] <-Bidirectional Link-> [^id2]
  - Child Node 3
    - Child Node 3-1 [^id3]
    - Child Node 3-2 [^id4]
    - Child Node 3-3 [^id5] {"fontFamily": "Arial", "fontWeight": "bold"}
    - > [^id3] >-Unidirectional Link-> [^id4]
  - Child Node 4
    - Child Node 4-1 [^id6]
    - Child Node 4-2 [^id7]
    - Child Node 4-3 [^id8]
    - } Summary of all previous nodes
    - Child Node 4-4
- > [^node-2-1] <-Link position is not restricted, as long as the id can be found during rendering-> [^id8]
```

---

## 2. 核心数据结构

### 2.1 MindElixirData

```typescript
type MindElixirData = {
  nodeData: NodeObj // 树的根节点
  arrows?: Arrow[] // 箭头连接列表
  summaries?: Summary[] // 概括列表
}
```

### 2.2 NodeObj（节点）

```typescript
interface NodeObj {
  topic: string             // 节点文本
  id: string                // 唯一标识符（运行时生成）
  style?: { fontSize, fontFamily, color, background, fontWeight, ... }
  children?: NodeObj[]      // 子节点列表
  metadata?: {
    refId: string           // plaintext 中的引用 ID（如 "node-2-1"）
  }
}
```

### 2.3 Arrow（箭头）

```typescript
interface Arrow {
  id: string
  label: string // 连接标签
  from: string // 起始节点 ID
  to: string // 目标节点 ID
  bidirectional?: boolean // 是否双向
  metadata?: {
    parentId: string | null // 在 plaintext 中所属父节点的 ID
    index: number // 在父节点子列表中的位置索引
  }
}
```

### 2.4 Summary（概括）

```typescript
interface Summary {
  id: string
  label: string // 概括文本
  parent: string // 父节点 ID
  start: number // 起始子节点索引（0-based）
  end: number // 结束子节点索引（0-based）
}
```

---

## 3. Plaintext → MindElixir (`plaintextToMindElixir`)

### 3.1 整体流程

```
输入: plaintext 字符串
  ↓
按行分割 & 过滤空行
  ↓
单次遍历所有行，用栈维护层级关系
  ↓
后处理 Arrow 行（解析引用 ID 到实际节点 ID）
  ↓
输出: MindElixirData
```

### 3.2 解析上下文

```typescript
interface ParseContext {
  arrowLines: { content: string; parentId: string | null; index: number }[]
  nodeIdMap: Map<string, string> // [^refId] → 实际节点 ID
}
```

- `arrowLines`: 收集所有 Arrow 行原始内容及其位置信息（父节点 ID + 索引），延迟到遍历结束后处理
- `nodeIdMap`: 在遍历过程中建立 refId 到实际生成的节点 ID 的映射

### 3.3 逐行解析算法

使用一个**栈 (stack)** 来追踪当前的祖先路径。栈中每个元素记录 `{ indent, node }`。

对于每一行：

1. **计算缩进** (`getIndent`): 统计行首空格数

2. **解析行内容** (`parseLine`): 去掉 `- ` 前缀后判断类型：
   - 以 `>` 开头 → `arrow` 类型
   - 以 `}` 开头 → `summary` 类型
   - 其他 → `node` 类型（进一步提取 refId 和 style）

3. **弹栈定位父节点**: 从栈顶开始弹出所有 `indent >= 当前缩进` 的元素，栈顶即为当前行的父节点

4. **按类型处理**:
   - **Arrow**: 记录到 `context.arrowLines`，同时记录它所属的父节点 ID 和在子列表中的位置索引
   - **Summary**: 调用 `parseSummary` 解析格式（`:N label` 或纯 `label`），根据计数确定覆盖范围 `[start, end]`
   - **Node**: 生成唯一 ID，创建 `NodeObj`，设置 style 和 metadata.refId（如果有），挂载到父节点的 `children` 数组，然后压入栈中

### 3.4 多顶层节点处理

如果 plaintext 中有多个缩进相同的顶层节点，自动创建一个名为 `rootName`（默认 `'Root'`）的合成根节点将它们包裹为其子节点。

### 3.5 Arrow 后处理

Arrow 行的解析延迟到遍历完成后进行，因为被引用的节点可能出现在 Arrow 行之后。

`parseArrow` 使用正则匹配两种格式：

| 正则模式                  | 对应格式 |
| ------------------------- | -------- |
| `[^id1] <-label-> [^id2]` | 双向连接 |
| `[^id1] >-label-> [^id2]` | 正向连接 |

每个 Arrow 对象会附加 `metadata: { parentId, index }` 来记录它在 plaintext 中的原始位置，以实现无损往返。

### 3.6 Summary 解析

`parseSummary(content, siblings, parentId)`:

1. 尝试匹配 `:N label` 格式，提取计数 N
2. 如果没有计数前缀，默认覆盖所有已出现的兄弟节点
3. 从 `siblings` 数组末尾取 N 个节点，计算 `start` 和 `end` 索引
4. 返回 `Summary` 对象

---

## 4. MindElixir → Plaintext (`mindElixirToPlaintext`)

### 4.1 整体流程

```
输入: MindElixirData
  ↓
构建 Plaintext 节点树 (PtTree)，包含 slots 以容纳前置/后置元素
  ↓
遍历所有 Arrow 和 Summary，按关联位置插入到各个节点树对应的 slot 中
  ↓
从根节点递归遍历 PtTree，交错提取 slots 和 children 拼接多行字符串
  ↓
输出: plaintext 字符串
```

### 4.2 核心中间结构 (`PtTree` 与 `slots`)

为了彻底解决原始算法中计算下标偏移导致的错乱问题，引入了 `PtTree` 和 `slots` 模型：

```typescript
type PtElement = { type: 'arrow'; arrow: Arrow } | { type: 'summary'; summary: Summary }

class PtTree {
  node: NodeObj
  children: PtTree[] = []
  slots: PtElement[][] // 长度为 children.length + 1
}
```

- **`children`**: 纯粹由 `PtTree` 实例组成的数组，完全对应 MindElixir 数据中的节点树骨架，不夹杂任何非节点的额外元素。
- **`slots`**: 附属于该层节点的“信箱”。`slots[i]` 代表“**在打印第 `i` 个纯子节点之前，需要优先打印的额外元素（Arrow / Summary）**”。最后一个 slot `slots[children.length]` 代表“**在打印完所有子节点之后，要追加打印的元素**”。

这种设计将树节点的“绝对坐标”锁定，任何时候向 `slots[i]` 放入新元素，都不会挤占纯节点的下标影响后续计算。

### 4.3 构建与映射分离

1. **节点树构建 (`buildTree`)**: 第一次递归将原始的纯节点（NodeObj）映射至 `PtTree` 的 `children` 骨架中。同时将所有的 Node 扁平化存入 `treeMap: Map<string, PtTree>` 以备按 `node.id` O(1) 查找。
2. **Arrow 归位**: 遍历 `arrows`：
   - 提取 `arrow.metadata` 中的 `parentId` 和原始 `index`。
   - 通过 `treeMap.get(parentId)` 定位到父树。
   - 直接将其作为 `arrow` 类型推入 `parentTree.slots[index]`。
   - （同时记录此 Arrow 的起止节点 ID 到 `referencedIds` 集合中用于生成引用标记）。
3. **Summary 归位**: 遍历 `summaries`：
   - 提取 `summary.parent` 和概括区域的结束位置 `summary.end`。
   - 根据规则，对从 `start` 到 `end` 节点的概括行应该出现在**紧接着第 `end` 个节点之后**。
   - 计算得到它应处于的 slot 索引为 `end + 1`，将其作为 `summary` 类型推入 `parentTree.slots[end + 1]`。

### 4.4 递归序列化 (`dump`)

当所有的骨架搭建完毕、所有的附属元素填进对应的 Slots 后，执行一趟极其扁平纯粹的递归 DFS (`dump`):

对每个 `PtTree` 节点：

1. **输出自身节点行**:
   - 包含自身的话题 (`node.topic`)。
   - 如果它在原始明文中显式声明了引用 `refId`，或者在此次转换中被箭头连接引用过（存在于 `referencedIds` 中），则追加 `[^refId]`（缺省使用 UUID）。
   - 如果携带 `style` 属性则追加 JSON 格式的样式。
2. **交错提取 Slots 与 Children**:
   用一层简单的 `for` 循环遍历所有的 Slots (从 `0` 到 `children.length`)：
   - 取出当前 `slots[i]` 里积攒的数组，按序分别把 Arrow 格式化成 `> [^ref] ...` ，把 Summary 格式化成 `}:N label` 并输出成单行。
   - （如果当前没越界）递归下降执行 `dump(tree.children[i])` 输出下一个子节点的内容。

### 4.5 顶层 Arrow 处理

对于 `parentId === null || ''` 或者在树中根本找不到归属父节点的失联 Arrow ，它们会被统一搜集在 `rootArrows` 数组中。
在整个 `dump()` 遍历全部完成后，这些顶层/游离的 Arrow 将被格式化并统一追加到输出结果的末尾。

---

## 5. 无损往返 (Roundtrip)

转换设计的一个核心目标是**无损往返**: `plaintext → MindElixir → plaintext` 能还原出完全相同的文本。

实现关键机制：

| 信息               | 存储位置                                           | 用途                                             |
| ------------------ | -------------------------------------------------- | ------------------------------------------------ |
| 节点引用 ID        | `node.metadata.refId` 或 节点 ID                   | 保持 `[^refId]` 不变                             |
| Arrow 的原始位置   | `arrow.metadata.parentId` + `arrow.metadata.index` | 准确落入重建的 `slots[index]` 数组中             |
| Summary 的范围信息 | `summary.parent` + `summary.end`                   | 准确落入重建的 `slots[end + 1]` 数组中并还原格式 |

基于 `slots` 算法的稳定性，当节点/Arrow 携带这些 plaintext metadata 时，再不会触发因为列表拼接导致的游标计算错误问题，输出可保证与原始输入逻辑上的严密一致。
