import { canvasEvents } from "@/helpers/canvas-events";
import { changeSelectionRender, elementUpdater, getSelectionBoxState, useGhostSelectionRectEvent, useHoverSelectionRectEvent, useSelectionBoxEvent } from "..";
import { useEffect, useRef } from "react";
import _ from "lodash";
import { getProjectState } from "@/store";

export const useSelectionEvent = () => {
  const mouseRef = useRef({
    oldElements: [] as any[],
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
    })
    canvasEvents.on('selection:dragMove', ({ dx, dy }) => {
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