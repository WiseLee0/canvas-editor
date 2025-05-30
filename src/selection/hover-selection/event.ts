import { useEffect, useRef } from "react"
import { getProjectState, setProjectState } from "@/store"
import { getCursor, getGhostSelectionRectState, getHoverSelectionState, setHoverSelectionState, getSelectionBoxState, setSelectionBoxState, getPointerForElement, getTransform, hitPointerForSelectionBox, hitTestRectNodes, isPointInRect, useSelectionState, getSelectionState, disableHoverConfig } from ".."
import Konva from "konva"
import { canvasEvents } from "@/helpers/canvas-events"
export const useHoverSelectionRectEvent = () => {
    const stage = useSelectionState('stage')!
    const mouseRef = useRef({
        isDown: false,
        isEnoughMove: false,
        isPointerForBox: false,
        isSelect: false,
        clientX: 0,
        clientY: 0,
        preCursor: '',
    })
    useEffect(() => {
        if (!stage) return;
        const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
            const { shiftKey } = e.evt
            getHoverNode(shiftKey)
            setSelectionDown(shiftKey)
            mouseRef.current.isEnoughMove = false
            mouseRef.current.isDown = true
            mouseRef.current.clientX = e.evt.clientX
            mouseRef.current.clientY = e.evt.clientY
        }

        const handleMouseMove = (e: MouseEvent) => {
            getHoverNode(e.shiftKey)
            if (!mouseRef.current.isDown) return;
            if (!mouseRef.current.isEnoughMove) {
                const diffX = e.clientX - mouseRef.current.clientX
                const diffY = e.clientY - mouseRef.current.clientY
                // 移动阈值
                const moveThreshold = 2
                if (!mouseRef.current.isEnoughMove && (Math.abs(diffX) > moveThreshold || Math.abs(diffY) > moveThreshold)) {
                    mouseRef.current.isEnoughMove = true
                }
            }
        }

        const handleMouseUp = (e: MouseEvent) => {
            setSelectionUp(e.shiftKey)
            mouseRef.current.isDown = false
            mouseRef.current.isEnoughMove = false
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

    // 鼠标悬停元素获取
    const getHoverNode = (isShiftKey: boolean = false) => {
        const pos = stage.getRelativePointerPosition()
        const ghostNode = getGhostSelectionRectState('node')
        const isDragging = getSelectionBoxState('isDragging')
        const selectionBox = getSelectionBoxState('nodes')
        // 存在框选节点，或者正在拖拽，或者没有鼠标位置，则不进行Hover
        if (!isDragging) {
            stage.content.style.cursor = mouseRef.current.preCursor
        }
        if (!pos || ghostNode || isDragging) {
            setHoverSelectionState({ node: null })
            return
        }

        const { x, y } = pos
        const scale = getProjectState('viewport').scale
        const hotRect = 4 / scale
        const node = {
            x: x - hotRect, y: y - hotRect, width: hotRect, height: hotRect, rotation: 0
        }

        // 锚点、边框热区内不可Hover
        if (hoverSelectionBox(selectionBox, pos)) {
            setHoverSelectionState({ node: null })
            return;
        }

        // 如果没有按住shift键，选区范围内不可Hover
        if (!isShiftKey) {
            for (let i = 0; i < selectionBox.length; i++) {
                const element = selectionBox[i];
                if (hitTestRectNodes(node, element)) {
                    setHoverSelectionState({ node: null })
                    return;
                }
            }
        }

        // 鼠标碰撞检测，确定Hover元素
        const pointerForElement = getPointerForElement()
        // 禁用Hover
        if (pointerForElement?.element && disableHoverConfig.includes(pointerForElement?.element?.type)) {
            setHoverSelectionState({ node: null })
            return;
        }
        setHoverSelectionState({ node: pointerForElement?.renderNode ?? null })
    }

    const setSelection = (pointerForElement: any, isShiftKey: boolean = false) => {
        const { id, removeIds } = pointerForElement
        const selection = getProjectState('selection')
        if (isShiftKey) {
            if (selection.includes(id)) {
                setProjectState({ selection: selection.filter((curId: string) => curId !== id) })
            } else {
                let newSelection = selection
                if (removeIds.length) {
                    newSelection = selection.filter((item: string) => !removeIds.includes(item))
                }
                setProjectState({ selection: [...newSelection, id] })
            }
        } else {
            setProjectState({ selection: [id] })
        }
    }

    const setSelectionDown = (isShiftKey: boolean = false) => {
        // 选中框内部
        const hotId = getHoverSelectionState('hotId')
        const pointerForBox = hitPointerForSelectionBox()
        mouseRef.current.isPointerForBox = Boolean(pointerForBox)
        if (pointerForBox || hotId) {
            return;
        }

        // 选中框之外
        const pointerForElement = getPointerForElement()
        if (!pointerForElement) {
            if (isShiftKey) return
            canvasEvents.emit('stage:clickBackground')
            return;
        }

        setSelection(pointerForElement, isShiftKey)
    }

    const setSelectionUp = (isShiftKey: boolean = false) => {
        // 选中框之外
        const hotId = getHoverSelectionState('hotId')
        const pointerForBox = mouseRef.current.isPointerForBox
        if (!pointerForBox || hotId) {
            return;
        }

        // 选中框内部
        const pointerForElement = getPointerForElement()
        if (!pointerForElement && !mouseRef.current.isEnoughMove) {
            canvasEvents.emit('stage:clickBackground')
            return;
        }
        if (mouseRef.current.isEnoughMove) {
            return
        }

        setSelection(pointerForElement, isShiftKey)
    }

    const hoverSelectionBox = (boxs: any[], pos: { x: number, y: number }) => {
        if (!boxs?.length) {
            setSelectionBoxState({ dragNodeId: '' })
            setHoverSelectionState({ hotId: '' })
            return;
        }
        const stage = getSelectionState('stage')
        const hoverBox = (box: any) => {
            const scale = getProjectState('viewport').scale
            const boxTransform = getTransform(box)
            const boxPos = boxTransform.invert().point(pos)
            // 锚点热区
            const anchorHoverVal = 16 / scale
            const anchorRects = [
                { id: 'anchor-top-left', cursor: 'nwse-resize', x: 0, y: 0, width: anchorHoverVal, height: anchorHoverVal },
                { id: 'anchor-top-right', cursor: 'nesw-resize', x: box.width, y: 0, width: anchorHoverVal, height: anchorHoverVal },
                { id: 'anchor-bottom-left', cursor: 'nesw-resize', x: 0, y: box.height, width: anchorHoverVal, height: anchorHoverVal },
                { id: 'anchor-bottom-right', cursor: 'nwse-resize', x: box.width, y: box.height, width: anchorHoverVal, height: anchorHoverVal }
            ].map(item => ({ ...item, x: item.x - anchorHoverVal / 2, y: item.y - anchorHoverVal / 2 }))
            for (const anchor of anchorRects) {
                if (isPointInRect(boxPos, anchor)) {
                    mouseRef.current.preCursor = stage.content.style.cursor
                    stage.content.style.cursor = getCursor(anchor.cursor as any, box.rotation)
                    setHoverSelectionState({ hotId: anchor.id })
                    return true
                }
            }

            // 旋转热区
            const rotationHoverVal = 22 / scale
            const diff = 6 / scale
            const rotationRects = [
                { id: 'rotation-top-left', cursor: 'nwse-rotate', x: - anchorHoverVal / 2 - diff, y: - anchorHoverVal / 2 - diff, width: rotationHoverVal, height: rotationHoverVal },
                { id: 'rotation-top-right', cursor: 'nesw-rotate', x: box.width - anchorHoverVal / 2, y: - anchorHoverVal / 2 - diff, width: rotationHoverVal, height: rotationHoverVal },
                { id: 'rotation-bottom-left', cursor: 'swne-rotate', x: - anchorHoverVal / 2 - diff, y: box.height - anchorHoverVal / 2, width: rotationHoverVal, height: rotationHoverVal },
                { id: 'rotation-bottom-right', cursor: 'senw-rotate', x: box.width - anchorHoverVal / 2, y: box.height - anchorHoverVal / 2, width: rotationHoverVal, height: rotationHoverVal }
            ]
            for (const rotationAnchor of rotationRects) {
                if (isPointInRect(boxPos, rotationAnchor)) {
                    mouseRef.current.preCursor = stage.content.style.cursor
                    stage.content.style.cursor = getCursor(rotationAnchor.cursor as any, box.rotation)
                    setHoverSelectionState({ hotId: rotationAnchor.id })
                    return true
                }
            }

            // 边框热区
            const borderHoverVal = 16 / scale
            const borderRects = [
                { id: 'border-top', cursor: 'ns-resize', x: 0, y: 0, width: box.width + borderHoverVal, height: borderHoverVal },
                { id: 'border-bottom', cursor: 'ns-resize', x: 0, y: box.height, width: box.width + borderHoverVal, height: borderHoverVal },
                { id: 'border-left', cursor: 'ew-resize', x: 0, y: 0, width: borderHoverVal, height: box.height + borderHoverVal },
                { id: 'border-right', cursor: 'ew-resize', x: box.width, y: 0, width: borderHoverVal, height: box.height + borderHoverVal }
            ].map(item => ({ ...item, x: item.x - borderHoverVal / 2, y: item.y - borderHoverVal / 2 }))
            for (const borderAnchor of borderRects) {
                if (isPointInRect(boxPos, borderAnchor)) {
                    mouseRef.current.preCursor = stage.content.style.cursor
                    stage.content.style.cursor = getCursor(borderAnchor.cursor as any, box.rotation)
                    setHoverSelectionState({ hotId: borderAnchor.id })
                    return true
                }
            }

            return false
        }
        for (const box of boxs) {
            if (hoverBox(box)) {
                setSelectionBoxState({ dragNodeId: box.id })
                return true
            }
        }
        setSelectionBoxState({ dragNodeId: '' })
        setHoverSelectionState({ hotId: '' })
        stage.content.style.cursor = mouseRef.current.preCursor
        return false
    }
}