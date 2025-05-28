import { useEffect, useRef } from "react"
import { getSharedStage } from "../App"
import { getProjectState } from "../projectState"
import { getSelectionBoxState, elementUpdater } from "../selection-box"
import { getHoverSelectionRectState } from "../hover-selection-rect"
import _ from "lodash"
import { hitPointerForSelectionBox } from "../utils"

export const useDragBoxEvent = () => {
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
        const stage = getSharedStage()
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
            const scale = getProjectState('scale')
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

        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])


}