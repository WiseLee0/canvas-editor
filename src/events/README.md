# 事件系统

## 概述

这是一个全新设计的事件系统，提供了类型安全、高性能、可扩展的事件处理能力。

## 核心特性

- 🎯 **类型安全**: 完全类型化的事件定义和处理
- 🚀 **高性能**: 内置防抖、节流和优先级处理
- 🔧 **可扩展**: 中间件支持和插件化架构
- 🐛 **易调试**: 内置调试模式和事件统计
- ⚡ **现代化**: 基于TypeScript，支持异步处理

## 快速开始

### 基础用法

```typescript
import { events } from '@/events';

// 订阅事件
const unsubscribe = events.on('selection:change', (event) => {
  console.log('选择变化:', event.selectedIds);
});

// 发射事件
events.emitSync('selection:change', {
  selectedIds: ['1', '2'],
  previousSelectedIds: ['1'],
  addedIds: ['2'],
  removedIds: []
});

// 取消订阅
unsubscribe();
```

### 使用事件总线

```typescript
import { EventBus } from '@/events';

// 快速订阅常用事件
EventBus.onSelectionChange((event) => {
  console.log('选择变化:', event.selectedIds);
});

EventBus.onDrag(
  (start) => console.log('开始拖拽'),
  (move) => console.log('拖拽中'),
  (end) => console.log('拖拽结束')
);
```

## 目录结构

```
src/events/
├── types/                  # 事件类型定义
│   ├── base.ts            # 基础类型
│   ├── canvas-events.ts   # 画布相关事件
│   ├── selection-events.ts # 交互相关事件
│   └── index.ts           # 类型导出
├── core/                  # 核心实现
│   ├── event-emitter.ts   # 事件发射器
│   └── event-manager.ts   # 事件管理器
├── utils/                 # 工具类
│   └── event-bus.ts       # 事件总线
├── index.ts               # 主入口
└── README.md              # 本文档
```

## 事件类型

### 画布事件
- `stage:*` - 舞台创建、销毁、点击等
- `viewport:*` - 视窗变化、缩放、平移等
- `render:*` - 渲染前后、图层更新等

### 交互事件
- `selection:*` - 选择变化、清除、焦点等
- `drag:*` - 拖拽开始、移动、结束等
- `hover:*` - 悬停进入、离开、移动等
- `transform:*` - 变换开始、移动、结束等

## 高级功能

### 中间件

```typescript
import { eventManager } from '@/events';

// 添加日志中间件
eventManager.use((event, next) => {
  console.log('事件:', event.type);
  next();
});
```

### 事件流

```typescript
// 创建事件流
const stream = events.stream('hover:move');

for await (const event of stream) {
  console.log('悬停位置:', event.position);
}
```

### 防抖/节流

```typescript
// 防抖
EventBus.onDebounced('hover:move', handler, 300);

// 节流
EventBus.onThrottled('drag:move', handler, 100);
```

## 调试

```typescript
// 启用调试模式
events.enableDebug();

// 查看统计信息
console.log(events.getStats());
```

## 性能优化

1. **优先级**: 为重要的监听器设置高优先级
2. **被动监听**: 对不阻塞主流程的操作使用 `passive: true`
3. **防抖节流**: 对高频事件使用防抖或节流
4. **及时清理**: 组件销毁时取消事件订阅

## 使用示例

### 选择事件

```typescript
import { events } from '@/events';

// 监听选择变化
events.on('selection:change', (event) => {
  console.log('当前选择:', event.selectedIds);
  console.log('新增选择:', event.addedIds);
  console.log('移除选择:', event.removedIds);
});

// 触发选择更新
events.emitSync('selection:update', {
  selectedIds: ['element1', 'element2']
});
```

### 拖拽事件

```typescript
import { EventBus } from '@/events';

// 监听完整的拖拽流程
EventBus.onDrag(
  (start) => {
    console.log('拖拽开始:', start.elementIds);
  },
  (move) => {
    console.log('拖拽移动:', move.delta);
  },
  (end) => {
    console.log('拖拽结束:', end.totalDelta);
  }
);
```

### 舞台事件

```typescript
import { events } from '@/events';

// 监听背景点击
events.on('stage:clickBackground', () => {
  console.log('点击了背景，清除选择');
});
``` 