# 元素更新管理器 (ElementUpdater)

统一的元素更新管理器，用于处理画布编辑器中所有元素的属性更新和重新渲染。

## 功能特性

- 🔄 **统一更新逻辑**: 所有元素更新操作通过统一的接口处理
- 🎯 **类型安全**: 完整的 TypeScript 类型定义
- 🚀 **批量操作**: 支持批量更新多个元素
- 🎨 **自动渲染**: 自动触发选择框重新渲染
- 📐 **多种变换**: 支持矩阵变换、缩放、等比缩放、位置移动等

## 使用方法

### 1. 导入更新管理器

```typescript
import { elementUpdater } from '../selection-box'
```

### 2. 单个元素更新（支持变换矩阵）

用于处理复杂的变换操作，如旋转、缩放、移动等：

```typescript
import { Transform } from "konva/lib/Util"

const tr = new Transform()
tr.translate(10, 20)
tr.scale(1.5, 1.5)

elementUpdater.updateSingleElement({
  element: currentElement,
  oldTransform: originalTransform,
  transform: tr,
  width: newWidth,
  height: newHeight
})
```

### 3. 多个元素非等比变换

用于处理多个元素的独立缩放：

```typescript
elementUpdater.batchUpdateMultipleTransform(
  elements,           // 当前元素数组
  oldElements,        // 原始元素数组
  oldBoxNodes,        // 原始包围盒数组
  finalDeltaX,        // X轴缩放比例
  finalDeltaY,        // Y轴缩放比例
  hotId,             // 操作热区ID
  originalDeltaX,     // 原始X轴缩放比例
  originalDeltaY      // 原始Y轴缩放比例
)
```

### 4. 多个元素等比变换

用于处理多个元素的等比缩放：

```typescript
elementUpdater.batchUpdateKeepRatio(
  elements,           // 当前元素数组
  oldElements,        // 原始元素数组
  oldBoxNodes,        // 原始包围盒数组
  finalScale,         // 最终缩放比例
  hotId,             // 操作热区ID
  originalScale       // 原始缩放比例
)
```

### 5. 批量位置移动

用于处理元素的拖拽移动：

```typescript
elementUpdater.batchUpdatePositions(
  boxs,              // 包围盒数组
  oldElements,       // 原始元素数组
  dx,               // X轴偏移量
  dy                // Y轴偏移量
)
```

### 6. 自定义批量更新

用于自定义的批量更新逻辑：

```typescript
elementUpdater.batchUpdate({
  elements: currentElements,
  oldElements: originalElements,
  updateFn: (element, oldElement, index) => {
    // 自定义更新逻辑
    element.x = oldElement.x + customDx
    element.y = oldElement.y + customDy
    element.rotation = oldElement.rotation + 45
  }
})
```

## 支持的操作热区

### 边框操作
- `border-left`: 左边框拖拽
- `border-right`: 右边框拖拽  
- `border-top`: 上边框拖拽
- `border-bottom`: 下边框拖拽

### 锚点操作
- `anchor-top-left`: 左上角锚点
- `anchor-top-right`: 右上角锚点
- `anchor-bottom-left`: 左下角锚点
- `anchor-bottom-right`: 右下角锚点

### 旋转操作
- `rotation-top-left`: 左上角旋转控制点
- `rotation-top-right`: 右上角旋转控制点
- `rotation-bottom-left`: 左下角旋转控制点
- `rotation-bottom-right`: 右下角旋转控制点