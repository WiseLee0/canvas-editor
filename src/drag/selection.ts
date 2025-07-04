import { useEffect, useRef } from "react"
import { getProjectState } from "@/store"
import _ from "lodash"
import { getHoverSelectionState, getPointerAbosultePos, hitPointerForSelectionBox, useSelectionState } from "../selection"
import { events } from "@/events"
import { KonvaEventObject } from "konva/lib/Node"

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
    const handleMouseDown = (event: KonvaEventObject<MouseEvent>) => {
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
      events.emitSync('drag:start', {
        elementIds: getProjectState('selection'),
        startPosition: { x: pos.x, y: pos.y },
        originalEvent: event.evt
      })
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
      events.emitSync('drag:move', {
        elementIds: getProjectState('selection'),
        currentPosition: { x: pos.x, y: pos.y },
        delta: { x: dx, y: dy },
        originalEvent: event
      })
    }
    const handleMouseUp = (event: MouseEvent) => {
      mouseRef.current.isDown = false
      mouseRef.current.isEnoughMove = false
      const pos = getPointerAbosultePos(stage, event)
      const totalDelta = pos ? { 
        x: pos.x - mouseRef.current.stageX, 
        y: pos.y - mouseRef.current.stageY 
      } : { x: 0, y: 0 }
      events.emitSync('drag:end', {
        elementIds: getProjectState('selection'),
        finalPosition: pos || { x: 0, y: 0 },
        totalDelta,
        originalEvent: event
      })
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