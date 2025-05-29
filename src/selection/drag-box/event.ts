import { useEffect, useRef } from "react"
import { getProjectState } from "@/store"
import { getSelectionBoxState, elementUpdater, hitPointerForSelectionBox, getHoverSelectionRectState, useSelectionBoxState } from ".."
import _ from "lodash"

export const useDragBoxEvent = () => {
    const stage = useSelectionBoxState('stage')
    const mouseRef = useRef({
        isDown: false,
        isEnoughMove: false,
        stageX: 0,
        stageY: 0,
        currentStageX: 0,
        currentStageY: 0,
        oldElements: [] as any[],
    })
    useEffect(() => {
        if (!stage) return;
        const handleMouseDown = () => {
            mouseRef.current.isDown = false
            const pos = stage.getRelativePointerPosition()
            const hotId = getHoverSelectionRectState('hotId')
            const boxs = getSelectionBoxState('nodes')
            const hasBox = hitPointerForSelectionBox()
            if (!pos || hotId || !boxs.length || !hasBox) return
            mouseRef.current.isDown = true
            mouseRef.current.stageX = pos.x
            mouseRef.current.stageY = pos.y
        }
        const handleMouseMove = () => {
            if (!mouseRef.current.isDown) return
            const pos = stage.getRelativePointerPosition()
            if (!pos) return
            const scale = getProjectState('viewport').scale
            const [dx, dy] = [pos.x - mouseRef.current.stageX, pos.y - mouseRef.current.stageY]
            const moveThreshold = 2 / scale
            if (!mouseRef.current.isEnoughMove && (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold)) {
                mouseRef.current.isEnoughMove = true
                mouseRef.current.oldElements = _.cloneDeep(getProjectState('elements'))
            }
            if (!mouseRef.current.isEnoughMove) return
            mouseRef.current.currentStageX = pos.x
            mouseRef.current.currentStageY = pos.y
            handleMoveElement()
        }
        const handleMouseUp = () => {
            mouseRef.current.isDown = false
            mouseRef.current.isEnoughMove = false
        }

        const handleMoveElement = () => {
            const [dx, dy] = [mouseRef.current.currentStageX - mouseRef.current.stageX, mouseRef.current.currentStageY - mouseRef.current.stageY]
            const oldElements = mouseRef.current.oldElements
            const boxs = getSelectionBoxState('nodes')

            // 使用统一的元素更新管理器
            elementUpdater.batchUpdatePositions(boxs, oldElements, dx, dy)
        }

        stage.on('mousedown', handleMouseDown)
        stage.on('mousemove', handleMouseMove)
        stage.on('mouseup', handleMouseUp)
        return () => {
            stage.off('mousedown', handleMouseDown)
            stage.off('mousemove', handleMouseMove)
            stage.off('mouseup', handleMouseUp)
        }
    }, [stage])
}