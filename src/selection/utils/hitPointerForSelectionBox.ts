import { getSelectionState } from "../core"
import { getSelectionBoxState } from "../selection-box"
import { getTransform, isPointInRect } from "./index"

export const hitPointerForSelectionBox = () => {
    const boxs = getSelectionBoxState('nodes')
    const stage = getSelectionState('stage')!
    const pointer = stage.getRelativePointerPosition()
    if (!boxs?.length || !pointer) return null
    
    for (const box of boxs) {
        // 获取选择框的变换矩阵
        const boxTransform = getTransform(box)
        // 将指针位置转换到选择框的局部坐标系
        const boxPos = boxTransform.invert().point(pointer)
        
        // 检查指针是否在选择框的矩形区域内
        if (isPointInRect(boxPos, { x: 0, y: 0, width: box.width, height: box.height })) {
            return box
        }
    }
    
    return null
}