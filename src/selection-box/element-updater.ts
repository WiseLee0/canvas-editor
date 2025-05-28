import { Transform } from "konva/lib/Util"
import { getElementById } from "../util"
import { changeSelectionRender } from "./state/render"

// 元素更新类型枚举
export enum UpdateType {
  SINGLE_ELEMENT = 'single',
  MULTIPLE_TRANSFORM = 'multiple_transform',
  MULTIPLE_KEEP_RATIO = 'multiple_keep_ratio'
}

// 单个元素更新参数
interface SingleElementUpdateParams {
  element: any
  oldTransform: Transform
  transform: Transform
  width: number
  height: number
}

// 多元素变换更新参数
interface MultipleTransformUpdateParams {
  element: any
  oldElement: any
  currentBox: any
  deltaX: number
  deltaY: number
  offsetX: number
  offsetY: number
}

// 多元素等比更新参数
interface MultipleKeepRatioUpdateParams {
  element: any
  oldElement: any
  currentBox: any
  scale: number
  offsetX: number
  offsetY: number
}

// 批量更新参数
interface BatchUpdateParams {
  elements: any[]
  oldElements: any[]
  updateFn: (element: any, oldElement: any, index: number) => void
}

/**
 * 统一的元素更新管理器
 */
export class ElementUpdater {
  private static instance: ElementUpdater | null = null

  private constructor() { }

  static getInstance(): ElementUpdater {
    if (!ElementUpdater.instance) {
      ElementUpdater.instance = new ElementUpdater()
    }
    return ElementUpdater.instance
  }

  /**
   * 更新单个元素（支持变换矩阵）
   */
  updateSingleElement(params: SingleElementUpdateParams): void {
    const { element, oldTransform, transform, width, height } = params

    const newTransform = oldTransform.multiply(transform)
    const result = newTransform.decompose()

    this.applyElementChanges(element, {
      x: result.x,
      y: result.y,
      width,
      height,
      rotation: result.rotation
    })

    this.triggerRender()
  }

  /**
   * 更新多个元素（非等比变换）
   */
  updateMultipleTransform(params: MultipleTransformUpdateParams): void {
    const { element, oldElement, currentBox, deltaX, deltaY, offsetX, offsetY } = params

    let newX: number, newY: number

    // 处理在父框架内的元素
    if (currentBox.frames[oldElement.id]) {
      const parentFrame = getElementById(currentBox.frames[oldElement.id])
      const bx = currentBox.x - parentFrame.x
      const by = currentBox.y - parentFrame.y
      newX = (oldElement.x - bx) * deltaX + bx + offsetX
      newY = (oldElement.y - by) * deltaY + by + offsetY
    } else {
      // 处理普通元素
      newX = (oldElement.x - currentBox.x) * deltaX + currentBox.x + offsetX
      newY = (oldElement.y - currentBox.y) * deltaY + currentBox.y + offsetY
    }

    this.applyElementChanges(element, {
      x: newX,
      y: newY,
      width: oldElement.width * deltaX,
      height: oldElement.height * deltaY
    })
  }

  /**
   * 更新多个元素（等比变换）
   */
  updateMultipleKeepRatio(params: MultipleKeepRatioUpdateParams): void {
    const { element, oldElement, currentBox, scale, offsetX, offsetY } = params

    let newX: number, newY: number

    // 处理在父框架内的元素
    if (currentBox.frames[oldElement.id]) {
      const parentFrame = getElementById(currentBox.frames[oldElement.id])
      const bx = currentBox.x - parentFrame.x
      const by = currentBox.y - parentFrame.y

      // 计算元素相对于包围盒的位置
      const relativeX = oldElement.x - bx
      const relativeY = oldElement.y - by

      // 应用等比缩放
      newX = relativeX * scale + bx + offsetX
      newY = relativeY * scale + by + offsetY
    } else {
      // 处理普通元素
      // 计算元素相对于包围盒的位置
      const relativeX = oldElement.x - currentBox.x
      const relativeY = oldElement.y - currentBox.y

      // 应用等比缩放
      newX = relativeX * scale + currentBox.x + offsetX
      newY = relativeY * scale + currentBox.y + offsetY
    }

    this.applyElementChanges(element, {
      x: newX,
      y: newY,
      width: oldElement.width * scale,
      height: oldElement.height * scale,
      rotation: oldElement.rotation // 旋转角度保持不变
    })
  }

  /**
   * 批量更新元素
   */
  batchUpdate(params: BatchUpdateParams): void {
    const { elements, oldElements, updateFn } = params

    elements.forEach((element, index) => {
      const oldElement = oldElements.find(e => e.id === element.id)
      if (oldElement) {
        updateFn(element, oldElement, index)
      }
    })

    this.triggerRender()
  }

  /**
   * 批量更新多元素变换
   */
  batchUpdateMultipleTransform(
    elements: any[],
    oldElements: any[],
    oldBoxNodes: any[],
    deltaX: number,
    deltaY: number,
    hotId: string,
    originalDeltaX: number,
    originalDeltaY: number
  ): void {
    this.batchUpdate({
      elements,
      oldElements,
      updateFn: (element, oldElement) => {
        const currentBox = oldBoxNodes.find((item: any) => item.selection.includes(oldElement.id))
        if (!currentBox) return

        // 计算当前框的偏移量
        const { offsetX, offsetY } = this.calculateBoxOffset(
          hotId,
          currentBox,
          originalDeltaX,
          originalDeltaY,
          deltaX,
          deltaY
        )

        // 更新元素位置和尺寸
        this.updateMultipleTransform({
          element,
          oldElement,
          currentBox,
          deltaX,
          deltaY,
          offsetX,
          offsetY
        })
      }
    })
  }

  /**
   * 批量更新等比变换
   */
  batchUpdateKeepRatio(
    elements: any[],
    oldElements: any[],
    oldBoxNodes: any[],
    scale: number,
    hotId: string,
    originalScale: number
  ): void {
    this.batchUpdate({
      elements,
      oldElements,
      updateFn: (element, oldElement) => {
        const currentBox = oldBoxNodes.find((item: any) => item.selection.includes(oldElement.id))
        if (!currentBox) return

        // 计算当前框的等比缩放偏移量
        const { offsetX, offsetY } = this.calculateKeepRatioBoxOffset(
          hotId,
          currentBox,
          originalScale,
          scale
        )

        // 更新元素位置和尺寸（等比缩放）
        this.updateMultipleKeepRatio({
          element,
          oldElement,
          currentBox,
          scale,
          offsetX,
          offsetY
        })
      }
    })
  }

  /**
   * 应用元素属性变更
   */
  private applyElementChanges(element: any, changes: Partial<{
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }>): void {
    Object.assign(element, changes)
  }

  /**
   * 计算框的偏移量（非等比变换）
   */
  private calculateBoxOffset(
    hotId: string,
    currentBox: any,
    originalDeltaX: number,
    originalDeltaY: number,
    finalDeltaX: number,
    finalDeltaY: number
  ): { offsetX: number; offsetY: number } {
    let offsetX = 0
    let offsetY = 0

    // 计算初始偏移量
    switch (hotId) {
      case 'border-left':
      case 'anchor-top-left':
      case 'anchor-bottom-left':
        offsetX = currentBox.width * (1 - originalDeltaX)
        break
    }

    switch (hotId) {
      case 'border-top':
      case 'anchor-top-left':
      case 'anchor-top-right':
        offsetY = currentBox.height * (1 - originalDeltaY)
        break
    }

    // 如果缩放比例被约束，重新计算偏移量
    if (finalDeltaX !== originalDeltaX) {
      switch (hotId) {
        case 'border-left':
        case 'anchor-top-left':
        case 'anchor-bottom-left':
          offsetX = currentBox.width * (1 - finalDeltaX)
          break
      }
    }

    if (finalDeltaY !== originalDeltaY) {
      switch (hotId) {
        case 'border-top':
        case 'anchor-top-left':
        case 'anchor-top-right':
          offsetY = currentBox.height * (1 - finalDeltaY)
          break
      }
    }

    return { offsetX, offsetY }
  }

  /**
   * 计算等比缩放的框偏移量
   */
  private calculateKeepRatioBoxOffset(
    hotId: string,
    currentBox: any,
    originalScale: number,
    finalScale: number
  ): { offsetX: number; offsetY: number } {
    let offsetX = 0
    let offsetY = 0

    const newWidth = currentBox.width * originalScale
    const newHeight = currentBox.height * originalScale

    // 计算初始偏移量
    if (hotId === 'border-right') {
      // 以左边中心为固定点进行等比缩放
      offsetX = 0 // 左边固定
      offsetY = (currentBox.height - newHeight) / 2 // 垂直居中
    } else if (hotId === 'border-bottom') {
      // 以上边中心为固定点进行等比缩放
      offsetX = (currentBox.width - newWidth) / 2 // 水平居中
      offsetY = 0 // 上边固定
    } else if (hotId === 'border-left') {
      // 以右边中心为固定点进行等比缩放
      offsetX = currentBox.width - newWidth // 右边固定
      offsetY = (currentBox.height - newHeight) / 2 // 垂直居中
    } else if (hotId === 'border-top') {
      // 以下边中心为固定点进行等比缩放
      offsetX = (currentBox.width - newWidth) / 2 // 水平居中
      offsetY = currentBox.height - newHeight // 下边固定
    } else if (hotId === 'anchor-top-left') {
      offsetX = currentBox.width - newWidth
      offsetY = currentBox.height - newHeight
    } else if (hotId === 'anchor-top-right') {
      offsetX = 0
      offsetY = currentBox.height - newHeight
    } else if (hotId === 'anchor-bottom-left') {
      offsetX = currentBox.width - newWidth
      offsetY = 0
    } else if (hotId === 'anchor-bottom-right') {
      offsetX = 0
      offsetY = 0
    }

    // 如果缩放比例被约束，重新计算偏移量
    if (finalScale !== originalScale) {
      const finalNewWidth = currentBox.width * finalScale
      const finalNewHeight = currentBox.height * finalScale

      if (hotId === 'border-right') {
        offsetX = 0
        offsetY = (currentBox.height - finalNewHeight) / 2
      } else if (hotId === 'border-bottom') {
        offsetX = (currentBox.width - finalNewWidth) / 2
        offsetY = 0
      } else if (hotId === 'border-left') {
        offsetX = currentBox.width - finalNewWidth
        offsetY = (currentBox.height - finalNewHeight) / 2
      } else if (hotId === 'border-top') {
        offsetX = (currentBox.width - finalNewWidth) / 2
        offsetY = currentBox.height - finalNewHeight
      } else if (hotId === 'anchor-top-left') {
        offsetX = currentBox.width - finalNewWidth
        offsetY = currentBox.height - finalNewHeight
      } else if (hotId === 'anchor-top-right') {
        offsetX = 0
        offsetY = currentBox.height - finalNewHeight
      } else if (hotId === 'anchor-bottom-left') {
        offsetX = currentBox.width - finalNewWidth
        offsetY = 0
      } else if (hotId === 'anchor-bottom-right') {
        offsetX = 0
        offsetY = 0
      }
    }

    return { offsetX, offsetY }
  }

  /**
   * 触发重新渲染
   */
  private triggerRender(): void {
    changeSelectionRender()
  }

  /**
   * 更新元素位置（简单移动）
   */
  updateElementPosition(elementId: string, oldElements: any[], dx: number, dy: number): void {
    const oldElement = getElementById(elementId, oldElements)
    const element = getElementById(elementId)

    if (!oldElement || !element) return

    this.applyElementChanges(element, {
      x: oldElement.x + dx,
      y: oldElement.y + dy
    })
  }

  /**
   * 批量更新元素位置（用于拖拽）
   */
  batchUpdatePositions(boxs: any[], oldElements: any[], dx: number, dy: number): void {
    if (!boxs?.length) return

    for (const box of boxs) {
      for (const elementId of box.selection) {
        this.updateElementPosition(elementId, oldElements, dx, dy)
      }
    }

    this.triggerRender()
  }
}

// 导出单例实例
export const elementUpdater = ElementUpdater.getInstance() 