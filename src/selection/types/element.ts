// 元素相关的类型定义
import { Transform } from "konva/lib/Util"

// 元素更新类型枚举
export enum UpdateType {
  SINGLE_ELEMENT = 'single',
  MULTIPLE_TRANSFORM = 'multiple_transform',
  MULTIPLE_KEEP_RATIO = 'multiple_keep_ratio'
}

// 单个元素更新参数
export interface SingleElementUpdateParams {
  element: any
  relativeTransform: Transform
  changeTransform: Transform
  width: number
  height: number
}

// 多元素变换更新参数
export interface MultipleTransformUpdateParams {
  element: any
  oldElement: any
  currentBox: any
  deltaX: number
  deltaY: number
  offsetX: number
  offsetY: number
}

// 多元素等比更新参数
export interface MultipleKeepRatioUpdateParams {
  element: any
  oldElement: any
  currentBox: any
  scale: number
  offsetX: number
  offsetY: number
}

// 批量更新参数
export interface BatchUpdateParams {
  elements: any[]
  oldElements: any[]
  updateFn: (element: any, oldElement: any, index: number) => void
}

// 元素变更接口
export interface ElementChanges {
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
} 