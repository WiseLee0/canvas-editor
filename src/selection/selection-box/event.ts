import { useEffect, useRef } from "react"
import { getProjectState, useProjectState, getElementById } from "@/store"
import { elementUpdater, getCursor, getHoverSelectionState, getPointsBoundingBox, getRotatedRectangleCorners, getTransform, transformRenderNode, flattenNestedArrays, clearSelectionNodes, getSelectionBoxConfig, getSelectionBoxState, setSelectionBoxState, useSelectionBoxState, getSelectionState, useSelectionState } from ".."
import _ from "lodash"
import { Transform } from "konva/lib/Util"

export const useSelectionBoxEvent = () => {
    const stage = useSelectionState('stage')
    const selection = useProjectState('selection')
    const renderDep = useSelectionBoxState('renderDep')
    const mouseRef = useRef({
        isDown: false,
        stageX: 0,
        stageY: 0,
        currentStageX: 0,
        currentStageY: 0,
        isEnoughMove: false,
        hotId: '',
        oldBoxNode: {} as any,
        oldBoxNodes: [] as any[],
        elements: [] as any[],
        oldElements: [] as any[]
    })

    useEffect(() => {
        if (!stage) return;
        const handleMouseDown = () => {
            mouseRef.current.isDown = true
            mouseRef.current.isEnoughMove = false
            const pos = stage.getRelativePointerPosition();
            const hotId = getHoverSelectionState('hotId')
            const selection = getProjectState('selection')
            if (!pos || !hotId || !selection.length) {
                mouseRef.current.isDown = false
                return
            }
            mouseRef.current.stageX = pos.x
            mouseRef.current.stageY = pos.y
            mouseRef.current.hotId = hotId
            setSelectionBoxState({ isDragging: true })
        }

        const handleMouseMove = () => {
            if (!mouseRef.current.isDown) return;
            const pos = stage.getRelativePointerPosition()
            if (!pos || !mouseRef.current.isDown) return
            const scale = getProjectState('viewport').scale
            mouseRef.current.currentStageX = pos.x
            mouseRef.current.currentStageY = pos.y
            const [dx, dy] = [pos.x - mouseRef.current.stageX, pos.y - mouseRef.current.stageY]
            // 移动阈值
            const moveThreshold = 2 / scale
            if (!mouseRef.current.isEnoughMove && (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold)) {
                const dragNodeId = getSelectionBoxState('dragNodeId')
                const boxs = getSelectionBoxState('nodes')
                const oldBoxNode = boxs.find((node: any) => node.id === dragNodeId);
                if (oldBoxNode) {
                    mouseRef.current.oldBoxNode = _.cloneDeep(oldBoxNode)
                    mouseRef.current.oldBoxNodes = _.cloneDeep(boxs)
                    mouseRef.current.elements = getProjectState('selection').map((id: any) => getElementById(id))
                    mouseRef.current.oldElements = _.cloneDeep(mouseRef.current.elements)
                }
                mouseRef.current.isEnoughMove = true
            }
            if (!mouseRef.current.isEnoughMove) {
                return
            }
            handleMovementDelta()
        }

        const handleMouseUp = () => {
            mouseRef.current.isDown = false
            mouseRef.current.isEnoughMove = false
            mouseRef.current.hotId = ''
            setSelectionBoxState({ isDragging: false })
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

    useEffect(() => {
        if (!selection.length) {
            clearSelectionNodes()
            return
        }
        const elements = getProjectState('elements')
        // 获取选中的Nodes
        const nodes = getSelectionNodes(selection, elements) as any[]
        // 扁平化Nodes
        const flatNodes = flattenNestedArrays(nodes)
        // 合并Nodes
        const boxs = mergeToBoxs(flatNodes) as any[]
        setSelectionBoxState({ nodes: boxs, innerNodes: nodes })
    }, [selection, renderDep])

    const handleOneResize = () => {
        const element = mouseRef.current.elements[0];
        const oldElement = mouseRef.current.oldElements[0];
        const config = getSelectionBoxConfig(element.type);
        const { hotId, currentStageX, currentStageY, stageX, stageY } = mouseRef.current;

        // 检查是否允许操作
        if (!isOperationAllowed(hotId, config)) return;

        // 初始化变换和坐标系转换
        const tr = new Transform();
        tr.reset();
        const oldTr = getTransform(oldElement);
        const [dx, dy] = [currentStageX - stageX, currentStageY - stageY];
        const [localDx, localDy] = convertToLocalCoordinates(dx, dy, oldElement.rotation);

        // 计算新尺寸
        let { width, height } = calculateNewDimensions(hotId, oldElement, localDx, localDy);

        // 应用尺寸限制和等比缩放
        ({ width, height } = applySizeConstraints(width, height, oldElement, config, hotId));

        // 计算位置变换
        applyTransform(tr, hotId, oldElement, width, height);

        // 处理旋转操作
        if (hotId.includes('rotation')) {
            handleRotation(tr, hotId, oldElement, currentStageX, currentStageY, oldTr);
            // 旋转操作不改变尺寸，直接使用原尺寸
            width = oldElement.width;
            height = oldElement.height;
        }

        // 使用统一的元素更新管理器
        elementUpdater.updateSingleElement({
            element,
            oldTransform: oldTr,
            transform: tr,
            width,
            height
        });
    };

    // 辅助函数：检查操作是否被允许
    const isOperationAllowed = (hotId: string, config: any): boolean => {
        if (hotId.includes('border') && !config.edgeListening) return false;
        if (hotId.includes('anchor') && !config.anchorListening) return false;
        if (hotId.includes('rotation') && !config.rotationListening) return false;
        return true;
    };

    // 辅助函数：坐标系转换
    const convertToLocalCoordinates = (dx: number, dy: number, rotation: number): [number, number] => {
        const radians = (rotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return [dx * cos + dy * sin, -dx * sin + dy * cos];
    };

    // 辅助函数：计算新尺寸
    const calculateNewDimensions = (hotId: string, oldElement: any, localDx: number, localDy: number) => {
        let width = oldElement.width;
        let height = oldElement.height;

        switch (hotId) {
            case 'border-right':
                width = oldElement.width + localDx;
                break;
            case 'border-bottom':
                height = oldElement.height + localDy;
                break;
            case 'border-left':
                width = oldElement.width - localDx;
                break;
            case 'border-top':
                height = oldElement.height - localDy;
                break;
            case 'anchor-top-left':
                width = oldElement.width - localDx;
                height = oldElement.height - localDy;
                break;
            case 'anchor-top-right':
                width = oldElement.width + localDx;
                height = oldElement.height - localDy;
                break;
            case 'anchor-bottom-left':
                width = oldElement.width - localDx;
                height = oldElement.height + localDy;
                break;
            case 'anchor-bottom-right':
                width = oldElement.width + localDx;
                height = oldElement.height + localDy;
                break;
        }

        return { width, height };
    };

    // 辅助函数：应用尺寸限制和等比缩放
    const applySizeConstraints = (width: number, height: number, oldElement: any, config: any, hotId: string) => {
        // 先应用基本尺寸限制
        width = Math.max(config.minWH[0], Math.min(config.maxWH[0], width));
        height = Math.max(config.minWH[1], Math.min(config.maxWH[1], height));

        // 如果需要等比缩放
        if (config.keepRatio && !hotId.includes('rotation')) {
            return applyProportionalScaling(width, height, oldElement, config, hotId);
        }

        return { width, height };
    };

    // 辅助函数：等比缩放处理
    const applyProportionalScaling = (width: number, height: number, oldElement: any, config: any, hotId: string) => {
        if (hotId.includes('anchor')) {
            // 角点拖拽：使用对角线距离计算缩放比例
            const oldDiagonal = Math.sqrt(oldElement.width * oldElement.width + oldElement.height * oldElement.height);
            const newDiagonal = Math.sqrt(width * width + height * height);
            const scale = newDiagonal / oldDiagonal;

            return applyScaleWithLimits(scale, oldElement, config);
        } else {
            // 边框拖拽：基于对面边中心点进行等比缩放
            const isHorizontalPrimary = hotId.includes('right') || hotId.includes('left');
            const scale = isHorizontalPrimary ? width / oldElement.width : height / oldElement.height;

            return applyScaleWithLimits(scale, oldElement, config);
        }
    };

    // 辅助函数：应用缩放并检查限制
    const applyScaleWithLimits = (scale: number, oldElement: any, config: any) => {
        let width = oldElement.width * scale;
        let height = oldElement.height * scale;

        // 检查缩放后的尺寸是否超出限制
        const maxScaleByWidth = config.maxWH[0] / oldElement.width;
        const maxScaleByHeight = config.maxWH[1] / oldElement.height;
        const minScaleByWidth = config.minWH[0] / oldElement.width;
        const minScaleByHeight = config.minWH[1] / oldElement.height;

        // 计算最终允许的缩放比例
        let finalScale = scale;
        if (width > config.maxWH[0] || height > config.maxWH[1]) {
            finalScale = Math.min(maxScaleByWidth, maxScaleByHeight, scale);
        }
        if (width < config.minWH[0] || height < config.minWH[1]) {
            finalScale = Math.max(minScaleByWidth, minScaleByHeight, scale);
        }

        return {
            width: oldElement.width * finalScale,
            height: oldElement.height * finalScale
        };
    };

    // 辅助函数：应用位置变换
    const applyTransform = (tr: Transform, hotId: string, oldElement: any, width: number, height: number) => {
        const widthChange = oldElement.width - width;
        const heightChange = oldElement.height - height;

        switch (hotId) {
            case 'border-left':
                // 左边拖拽：右边中心固定，需要调整位置
                tr.translate(widthChange, (oldElement.height - height) / 2);
                break;
            case 'border-right':
                // 右边拖拽：左边中心固定，垂直居中
                tr.translate(0, (oldElement.height - height) / 2);
                break;
            case 'border-top':
                // 上边拖拽：下边中心固定，需要调整位置
                tr.translate((oldElement.width - width) / 2, heightChange);
                break;
            case 'border-bottom':
                // 下边拖拽：上边中心固定，水平居中
                tr.translate((oldElement.width - width) / 2, 0);
                break;
            case 'anchor-top-left':
                tr.translate(widthChange, heightChange);
                break;
            case 'anchor-top-right':
                tr.translate(0, heightChange);
                break;
            case 'anchor-bottom-left':
                tr.translate(widthChange, 0);
                break;
        }
    };

    // 辅助函数：处理旋转
    const handleRotation = (tr: Transform, hotId: string, oldElement: any, currentStageX: number, currentStageY: number, oldTr: Transform) => {
        const halfW = oldElement.width / 2;
        const halfH = oldElement.height / 2;
        const invTr = oldTr.copy().invert();
        const { x: localDx, y: localDy } = invTr.point({ x: currentStageX, y: currentStageY });

        // 计算鼠标相对于元素中心的角度
        const centerX = halfW;
        const centerY = halfH;
        const mouseAngle = Math.atan2(localDy - centerY, localDx - centerX) * 180 / Math.PI;

        // 计算旋转控制点的初始角度
        const controlPointAngles: Record<string, number> = {
            'rotation-top-left': Math.atan2(-halfH, -halfW) * 180 / Math.PI,
            'rotation-top-right': Math.atan2(-halfH, halfW) * 180 / Math.PI,
            'rotation-bottom-left': Math.atan2(halfH, -halfW) * 180 / Math.PI,
            'rotation-bottom-right': Math.atan2(halfH, halfW) * 180 / Math.PI,
        };

        const controlPointAngle = controlPointAngles[hotId] || 0;
        let newRotation = mouseAngle - controlPointAngle;
        newRotation = (newRotation + 360) % 360;

        // 应用旋转变换
        tr.translate(halfW, halfH);
        tr.rotate(newRotation * (Math.PI / 180));
        tr.translate(-halfW, -halfH);

        // 更新光标
        updateRotationCursor(hotId, oldElement.rotation + newRotation);
    };

    // 辅助函数：更新旋转光标
    const updateRotationCursor = (hotId: string, rotation: number) => {
        const stage = getSelectionState('stage');
        const cursorMap: Record<string, string> = {
            'rotation-top-left': 'nwse-rotate',
            'rotation-top-right': 'nesw-rotate',
            'rotation-bottom-right': 'senw-rotate',
            'rotation-bottom-left': 'swne-rotate',
        };

        const cursorType = cursorMap[hotId];
        if (cursorType) {
            stage.content.style.cursor = getCursor(cursorType as any, rotation);
        }
    };

    const handleMultipleResize = () => {
        const oldBoxNode = mouseRef.current.oldBoxNode
        const { hotId, currentStageX, currentStageY, stageX, stageY } = mouseRef.current;
        const [dx, dy] = [currentStageX - stageX, currentStageY - stageY];

        // 计算基础缩放比例（基于被拖拽的框）
        const { deltaX, deltaY } = calculateBaseDelta(hotId, oldBoxNode, dx, dy);

        // 检查所有元素的尺寸限制，计算允许的缩放比例
        const constrainedScales = applyMultipleElementsConstraints(deltaX, deltaY);
        const finalDeltaX = constrainedScales.deltaX;
        const finalDeltaY = constrainedScales.deltaY;

        // 使用统一的元素更新管理器进行批量更新
        elementUpdater.batchUpdateMultipleTransform(
            mouseRef.current.elements,
            mouseRef.current.oldElements,
            mouseRef.current.oldBoxNodes,
            finalDeltaX,
            finalDeltaY,
            hotId,
            deltaX,
            deltaY
        );
    }

    // 计算基础缩放比例
    const calculateBaseDelta = (hotId: string, oldBoxNode: any, dx: number, dy: number) => {
        let deltaX = 1;
        let deltaY = 1;

        switch (hotId) {
            case 'border-right':
                deltaX = (oldBoxNode.width + dx) / oldBoxNode.width;
                break;
            case 'border-bottom':
                deltaY = (oldBoxNode.height + dy) / oldBoxNode.height;
                break;
            case 'border-left':
                deltaX = (oldBoxNode.width - dx) / oldBoxNode.width;
                break;
            case 'border-top':
                deltaY = (oldBoxNode.height - dy) / oldBoxNode.height;
                break;
            case 'anchor-top-left':
                deltaX = (oldBoxNode.width - dx) / oldBoxNode.width;
                deltaY = (oldBoxNode.height - dy) / oldBoxNode.height;
                break;
            case 'anchor-top-right':
                deltaX = (oldBoxNode.width + dx) / oldBoxNode.width;
                deltaY = (oldBoxNode.height - dy) / oldBoxNode.height;
                break;
            case 'anchor-bottom-left':
                deltaX = (oldBoxNode.width - dx) / oldBoxNode.width;
                deltaY = (oldBoxNode.height + dy) / oldBoxNode.height;
                break;
            case 'anchor-bottom-right':
                deltaX = (oldBoxNode.width + dx) / oldBoxNode.width;
                deltaY = (oldBoxNode.height + dy) / oldBoxNode.height;
                break;
        }

        return { deltaX, deltaY };
    }

    // 辅助函数：为多元素应用尺寸约束
    const applyMultipleElementsConstraints = (deltaX: number, deltaY: number) => {
        let constrainedDeltaX = deltaX;
        let constrainedDeltaY = deltaY;

        // 遍历所有元素，检查尺寸限制
        for (const element of mouseRef.current.elements) {
            const oldElement = mouseRef.current.oldElements.find(e => e.id === element.id);
            if (!oldElement) continue;

            const config = getSelectionBoxConfig(element.type);

            // 计算缩放后的尺寸
            const newWidth = oldElement.width * deltaX;
            const newHeight = oldElement.height * deltaY;

            // 检查宽度限制
            if (config.minWH && config.minWH[0] !== undefined) {
                if (newWidth < config.minWH[0]) {
                    const minRequiredDeltaX = config.minWH[0] / oldElement.width;
                    constrainedDeltaX = Math.max(constrainedDeltaX, minRequiredDeltaX);
                }
            }
            if (config.maxWH && config.maxWH[0] !== undefined) {
                if (newWidth > config.maxWH[0]) {
                    const maxAllowedDeltaX = config.maxWH[0] / oldElement.width;
                    constrainedDeltaX = Math.min(constrainedDeltaX, maxAllowedDeltaX);
                }
            }

            // 检查高度限制
            if (config.minWH && config.minWH[1] !== undefined) {
                if (newHeight < config.minWH[1]) {
                    const minRequiredDeltaY = config.minWH[1] / oldElement.height;
                    constrainedDeltaY = Math.max(constrainedDeltaY, minRequiredDeltaY);
                }
            }
            if (config.maxWH && config.maxWH[1] !== undefined) {
                if (newHeight > config.maxWH[1]) {
                    const maxAllowedDeltaY = config.maxWH[1] / oldElement.height;
                    constrainedDeltaY = Math.min(constrainedDeltaY, maxAllowedDeltaY);
                }
            }
        }

        return {
            deltaX: constrainedDeltaX,
            deltaY: constrainedDeltaY
        };
    };

    const handleMultipleKeepRatioResize = () => {
        const oldBoxNode = mouseRef.current.oldBoxNode
        const { hotId, currentStageX, currentStageY, stageX, stageY } = mouseRef.current;
        const [dx, dy] = [currentStageX - stageX, currentStageY - stageY];

        // 计算基础缩放比例（基于被拖拽的框）
        const scale = calculateKeepRatioScale(hotId, oldBoxNode, dx, dy);

        // 检查所有元素的尺寸限制，计算允许的缩放比例
        const finalScale = applyKeepRatioConstraints(scale);

        // 使用统一的元素更新管理器进行批量等比更新
        elementUpdater.batchUpdateKeepRatio(
            mouseRef.current.elements,
            mouseRef.current.oldElements,
            mouseRef.current.oldBoxNodes,
            finalScale,
            hotId,
            scale
        );
    }

    // 计算等比缩放比例
    const calculateKeepRatioScale = (hotId: string, oldBoxNode: any, dx: number, dy: number) => {
        let scale = 1;

        if (hotId === 'border-right') {
            scale = (oldBoxNode.width + dx) / oldBoxNode.width;
        } else if (hotId === 'border-bottom') {
            scale = (oldBoxNode.height + dy) / oldBoxNode.height;
        } else if (hotId === 'border-left') {
            scale = (oldBoxNode.width - dx) / oldBoxNode.width;
        } else if (hotId === 'border-top') {
            scale = (oldBoxNode.height - dy) / oldBoxNode.height;
        } else if (hotId.includes('anchor')) {
            // 角点拖拽：使用对角线距离计算等比缩放
            const oldDiagonal = Math.sqrt(oldBoxNode.width * oldBoxNode.width + oldBoxNode.height * oldBoxNode.height);
            let newDiagonal = oldDiagonal; // 默认值，防止未定义

            if (hotId === 'anchor-top-left') {
                newDiagonal = Math.sqrt((oldBoxNode.width - dx) * (oldBoxNode.width - dx) + (oldBoxNode.height - dy) * (oldBoxNode.height - dy));
            } else if (hotId === 'anchor-top-right') {
                newDiagonal = Math.sqrt((oldBoxNode.width + dx) * (oldBoxNode.width + dx) + (oldBoxNode.height - dy) * (oldBoxNode.height - dy));
            } else if (hotId === 'anchor-bottom-left') {
                newDiagonal = Math.sqrt((oldBoxNode.width - dx) * (oldBoxNode.width - dx) + (oldBoxNode.height + dy) * (oldBoxNode.height + dy));
            } else if (hotId === 'anchor-bottom-right') {
                newDiagonal = Math.sqrt((oldBoxNode.width + dx) * (oldBoxNode.width + dx) + (oldBoxNode.height + dy) * (oldBoxNode.height + dy));
            }

            scale = newDiagonal / oldDiagonal;
        }

        return scale;
    }

    // 辅助函数：为等比缩放应用尺寸约束
    const applyKeepRatioConstraints = (scale: number) => {
        let constrainedScale = scale;

        // 遍历所有元素，检查尺寸限制
        for (const element of mouseRef.current.elements) {
            const oldElement = mouseRef.current.oldElements.find(e => e.id === element.id);
            if (!oldElement) continue;

            const config = getSelectionBoxConfig(element.type);

            // 计算缩放后的尺寸
            const newWidth = oldElement.width * scale;
            const newHeight = oldElement.height * scale;

            // 检查宽度限制
            if (config.minWH && config.minWH[0] !== undefined) {
                if (newWidth < config.minWH[0]) {
                    const minRequiredScale = config.minWH[0] / oldElement.width;
                    constrainedScale = Math.max(constrainedScale, minRequiredScale);
                }
            }
            if (config.maxWH && config.maxWH[0] !== undefined) {
                if (newWidth > config.maxWH[0]) {
                    const maxAllowedScale = config.maxWH[0] / oldElement.width;
                    constrainedScale = Math.min(constrainedScale, maxAllowedScale);
                }
            }

            // 检查高度限制
            if (config.minWH && config.minWH[1] !== undefined) {
                if (newHeight < config.minWH[1]) {
                    const minRequiredScale = config.minWH[1] / oldElement.height;
                    constrainedScale = Math.max(constrainedScale, minRequiredScale);
                }
            }
            if (config.maxWH && config.maxWH[1] !== undefined) {
                if (newHeight > config.maxWH[1]) {
                    const maxAllowedScale = config.maxWH[1] / oldElement.height;
                    constrainedScale = Math.min(constrainedScale, maxAllowedScale);
                }
            }
        }

        return constrainedScale;
    };

    const handleMovementDelta = () => {
        const { elements } = mouseRef.current
        if (!elements?.length) return;
        // 一个元素进行调整
        if (elements.length === 1) {
            handleOneResize()
            return;
        }

        // 多个元素内存在旋转元素
        const hasRotation = elements.some((element: any) => element.rotation !== 0);
        const hasKeepRatio = elements.some((element: any) => getSelectionBoxConfig(element.type).keepRatio);
        if (hasRotation || hasKeepRatio) {
            handleMultipleKeepRatioResize()
            return;
        }

        // 多个元素进行调整
        handleMultipleResize()
    }
}

const getSelectionNodes = (selection: string[], elements: any[]) => {
    const node = []
    for (const element of elements) {
        if (selection.includes(element.id)) {
            node.push(transformRenderNode(element))
        }
        if (element?.elements) {
            const nodes = getSelectionNodes(selection, element.elements) as any[];
            if (nodes.length) {
                if (element.type === 'frame') {
                    nodes.forEach(item => {
                        item.x = item.x + element.x
                        item.y = item.y + element.y
                        item.__parentFrameId = element.id
                    })
                }
                node.push(nodes)
            }
        }
    }
    return node
}

const mergeToBoxs = (nodesArr: any[][]) => {
    // 如果只有一个元素被选中，则不合并
    if (nodesArr.length === 1 && nodesArr[0].length === 1) {
        const node = nodesArr[0][0]
        const frames = {} as any
        if (node.__parentFrameId) {
            frames[node.id] = node.__parentFrameId
        }
        return [{
            id: 'box-0',
            selection: [node.id],
            frames,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            rotation: node.rotation
        }];
    }
    // 如果多个元素被选中，则合并
    const newNodes = []
    for (const nodes of nodesArr) {
        const selection = []
        const frames = {} as any
        const points: { x: number, y: number }[] = []
        for (const node of nodes) {
            selection.push(node.id)
            if (node.__parentFrameId) {
                frames[node.id] = node.__parentFrameId
            }
            if (node.rotation === 0) {
                points.push({ x: node.x, y: node.y })
                points.push({ x: node.x + node.width, y: node.y })
                points.push({ x: node.x, y: node.y + node.height })
                points.push({ x: node.x + node.width, y: node.y + node.height })
            } else {
                points.push(...getRotatedRectangleCorners(node))
            }
        }
        const box = getPointsBoundingBox(points)
        newNodes.push({
            id: `box-${newNodes.length}`,
            selection,
            frames,
            x: box[0],
            y: box[1],
            width: box[2],
            height: box[3],
            rotation: 0
        })
    }
    return newNodes
}