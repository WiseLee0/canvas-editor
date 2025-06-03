import { canvasEvents } from "@/helpers/canvas-events";
import { changeSelectionRender, elementUpdater, getPointerAbosultePos, getPointerForFrameId, getSelectionBoxState, getSelectionState, useGhostSelectionRectEvent, useHoverSelectionRectEvent, useSelectionBoxEvent } from "..";
import { useEffect, useRef } from "react";
import _ from "lodash";
import { getElementById, getProjectState, setProjectState } from "@/store";

export const useSelectionEvent = () => {
  const mouseRef = useRef({
    oldElements: [] as any[],
    frameId: null as string | null,
    stageX: 0,
    stageY: 0,
  })
  useHoverSelectionRectEvent()
  useSelectionBoxEvent()
  useGhostSelectionRectEvent()

  useEffect(() => {
    canvasEvents.on('selection:update', () => {
      changeSelectionRender()
    })
    canvasEvents.on('selection:dragStart', () => {
      mouseRef.current.oldElements = _.cloneDeep(getProjectState('elements'))
      mouseRef.current.frameId = getPointerForFrameId()
      const pos = getSelectionState('stage')?.getRelativePointerPosition()
      mouseRef.current.stageX = pos?.x || 0
      mouseRef.current.stageY = pos?.y || 0
    })
    canvasEvents.on('selection:dragMove', (event: MouseEvent) => {
      const frameId = getPointerForFrameId()
      const stage = getSelectionState('stage')
      const pos = getPointerAbosultePos(stage, event)
      if (!pos) return;
      const dx = pos.x - mouseRef.current.stageX
      const dy = pos.y - mouseRef.current.stageY
      if (frameId !== mouseRef.current.frameId) {
        // 移入Frame
        if (frameId?.length) {
          moveInFrame(mouseRef.current.frameId, frameId)
        } else {
          moveOutFrame()
        }
        mouseRef.current.oldElements = _.cloneDeep(getProjectState('elements'))
        mouseRef.current.frameId = frameId
        mouseRef.current.stageX = pos.x
        mouseRef.current.stageY = pos.y
        return;
      }
      handleMoveElement(dx, dy)
    })
  }, [])

  const handleMoveElement = (dx: number, dy: number) => {
    const oldElements = mouseRef.current.oldElements
    const boxs = getSelectionBoxState('nodes')

    // 使用统一的元素更新管理器
    elementUpdater.batchUpdatePositions(boxs, oldElements, dx, dy)
  }
}

const moveInFrame = (oldFrameId: string | null, newFrameId: string) => {
  const oldFrame = oldFrameId ? getElementById(oldFrameId) : null;
  const frame = getElementById(newFrameId);
  if (!frame) return;
  const elements = getProjectState('elements')
  const boxs = getSelectionBoxState('nodes')
  const boxId = getSelectionBoxState('dragNodeId')
  const box = boxs.find(e => e.id === boxId)
  if (!box) return;
  const selection = [...box.selection];

  if (!selection.length) return;
  const outerElements = []
  // 鼠标在Frame外，移入Frame内
  if (!oldFrame) {
    // 获取所有在Frame外的元素 & 除了Frame
    for (const element of elements) {
      if (selection.includes(element.id)) {
        // 如果拖拽元素存在Frame，则不处理移入移出逻辑
        if (element.type === 'frame') return;
        element.x -= frame.x;
        element.y -= frame.y;
        outerElements.push(element)
      }
    }

    // 数据更新
    const result = []
    for (const element of elements) {
      if (selection.includes(element.id)) continue;
      if (frame.id === element.id) {
        element.elements = [...element.elements, ...outerElements]
      }
      result.push(element)
    }
    setProjectState({ elements: result })
    return;
  }
  // 鼠标在Frame内，移入新的Frame内
  for (const element of elements) {
    if (selection.includes(element.id)) {
      // 如果拖拽元素存在Frame，则不处理移入移出逻辑
      if (element.type === 'frame') return;
      element.x -= frame.x;
      element.y -= frame.y;
      outerElements.push(element)
    }
    if (oldFrameId === element.id && element.type === 'frame' && element?.elements?.length) {
      for (const child of element.elements) {
        if (selection.includes(child.id)) {
          child.x += element.x;
          child.y += element.y;
          child.x -= frame.x;
          child.y -= frame.y;
          outerElements.push(child)
        }
      }
    }
  }
  const removeIds = outerElements.map(e => e.id);
  // 数据更新
  const result = []
  for (const element of elements) {
    if (removeIds.includes(element.id)) continue;
    if (element?.elements?.length) {
      const temp = []
      for (const child of element.elements) {
        if (removeIds.includes(child.id)) continue;
        temp.push(child)
      }
      element.elements = temp
    }
    if (frame.id === element.id) {
      element.elements = [...element.elements, ...outerElements]
    }
    result.push(element)
  }
  setProjectState({ elements: result })
  return;
}

const moveOutFrame = () => {
  const elements = getProjectState('elements')
  const selection = getProjectState('selection');
  if (!selection.length) return;
  const result = []
  const outElements = []
  for (const element of elements) {
    if (element.type === 'frame' && element?.elements?.length) {
      const temp = []
      for (const child of element.elements) {
        if (selection.includes(child.id)) {
          child.x += element.x;
          child.y += element.y;
          outElements.push(child)
        } else {
          temp.push(child)
        }
      }
      element.elements = temp
    }
    result.push(element)
  }
  result.push(...outElements)
  setProjectState({ elements: result })
}