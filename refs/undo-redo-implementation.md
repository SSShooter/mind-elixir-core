# Mind Elixir Undo/Redo 实现分析

## 整体架构

采用**快照（Snapshot）模式**，每次操作保存完整的数据快照（`MindElixirData`），通过历史栈和指针实现 undo/redo。

## 核心数据结构

```typescript
history: History[]     // 历史记录栈
currentIndex: number   // 当前指针位置（-1 表示初始状态）
current: MindElixirData // 当前数据快照
currentSelectedNodes   // 当前选中的节点（用于记录操作上下文）
```

### History 条目

| 字段 | 说明 |
|------|------|
| `prev` | 操作前的完整数据快照 |
| `next` | 操作后的完整数据快照 |
| `operation` | 操作类型（如 `removeNodes`、`moveNodeIn` 等） |
| `currentSelected` | 操作时选中的节点 ID 列表 |
| `currentTarget` | 操作的目标对象，区分 `nodes` / `summary` / `arrow` 三种类型 |

## 工作流程

### 记录操作（handleOperation）

```
用户操作 → bus.emit('operation') → handleOperation
  1. 截断 history（丢弃 currentIndex 之后的记录，分支覆盖）
  2. 调用 mei.getData() 获取操作后的完整快照作为 next
  3. 构造 History 条目，push 入栈
  4. 更新 currentIndex 指针
```

**关键点**：`beginEdit` 操作被忽略（进入编辑态不产生有意义的历史）。

### Undo

```
currentIndex > -1 时：
  1. 取 history[currentIndex]
  2. mei.refresh(h.prev)  ← 用 prev 快照完全刷新画布
  3. 恢复选中状态：
     - 若操作是 removeNodes → 选中被删除的节点（恢复后它们重新出现）
     - 否则 → 选中操作前的选中节点
  4. currentIndex--
```

### Redo

```
currentIndex < history.length - 1 时：
  1. currentIndex++
  2. 取 history[currentIndex]
  3. mei.refresh(h.next)  ← 用 next 快照完全刷新画布
  4. 恢复选中状态：
     - 若操作是 removeNodes → 选中操作前的选中节点（因为 redo 后节点又被删了）
     - 否则 → 选中操作目标节点
```

### 选中恢复的对称逻辑

这是实现中最精巧的部分——undo/redo 的选中策略是**镜像对称**的：

| 操作类型 | Undo 选中 | Redo 选中 |
|----------|-----------|-----------|
| `removeNodes` | 被删节点（`currentTarget`） | 操作前选中（`currentSelected`） |
| 其他操作 | 操作前选中（`currentSelected`） | 操作目标（`currentTarget`） |

**原因**：删除操作 undo 后节点恢复，应选中它们；redo 后节点再次消失，应选中之前选中的节点。

## 生命周期管理

```typescript
// 插件返回清理函数
return () => {
  mei.bus.removeListener('operation', handleOperation)
  mei.bus.removeListener('selectNodes', handleSelectNodes)
  mei.container.removeEventListener('keydown', handleKeyDown)
}
```

键盘快捷键绑定在 `mei.container` 上：`Ctrl+Z` undo，`Ctrl+Shift+Z` / `Ctrl+Y` redo。

## 设计特点

1. **全量快照**：不做 diff/patch，每次保存完整数据。实现简单，代价是内存占用随操作次数线性增长
2. **分支覆盖**：undo 后执行新操作会截断后续历史，符合直觉
3. **事件驱动**：通过 `bus` 的 `operation` 和 `selectNodes` 事件解耦，history 插件无需侵入核心逻辑
4. **容错处理**：`try/catch` 包裹节点选中逻辑，防止 undo/redo 后节点不存在导致崩溃
