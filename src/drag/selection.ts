import { useEffect, useRef } from "react"
import { getProjectState } from "@/store"
import _ from "lodash"
import { getHoverSelectionState, getPointerAbosultePos, hitPointerForSelectionBox, useSelectionState } from "../selection"
import { canvasEvents } from "@/helpers/canvas-events"

export const useSelectionDragEvent = () => {
  const stage = useSelectionState('stage')
  const mouseRef = useRef({
    isDown: false,
    isEnoughMove: false,
    stageX: 0,
    stageY: 0,
  })
  useEffect(() => {
    if (!stage) return;
    const handleMouseDown = () => {
      mouseRef.current.isDown = false
      const pos = stage.getRelativePointerPosition()
      const hotId = getHoverSelectionState('hotId')
      const hasBox = hitPointerForSelectionBox()
      // 如果没有点击到画布禁止拖拽
      if (!pos) return;
      // 如果点击到选区边框热区禁止拖拽
      if (hotId) return;
      // 如果不存在选区禁止拖拽
      if (!hasBox) return;
      // 如果处于文本编辑态

      mouseRef.current.isDown = true
      mouseRef.current.stageX = pos.x
      mouseRef.current.stageY = pos.y
      canvasEvents.emit('selection:dragStart', { x: pos.x, y: pos.y })
    }
    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseRef.current.isDown) return
      const pos = getPointerAbosultePos(stage, event)
      if (!pos) return
      const scale = getProjectState('viewport').scale
      const [dx, dy] = [pos.x - mouseRef.current.stageX, pos.y - mouseRef.current.stageY]
      const moveThreshold = 2 / scale
      if (!mouseRef.current.isEnoughMove && (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold)) {
        mouseRef.current.isEnoughMove = true
      }
      if (!mouseRef.current.isEnoughMove) return
      canvasEvents.emit('selection:dragMove', { dx, dy })
    }
    const handleMouseUp = () => {
      mouseRef.current.isDown = false
      mouseRef.current.isEnoughMove = false
      canvasEvents.emit('selection:dragEnd')
    }


    stage.on('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      stage.off('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [stage])
}