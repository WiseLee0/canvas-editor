import { getProjectState } from "@/store"
import { getSelectionState } from "..";

// Frame不能嵌套，所以只需要找到最外层Frame即可
export const getPointerForFrameId = () => {
    const elements = getProjectState('elements')
    const selection = getProjectState('selection')
    if (!elements?.length) return null;
    const stage = getSelectionState('stage')
    const pos = stage?.getRelativePointerPosition();
    if (!pos) return null;
    const { x: posX, y: posY } = pos;
    const len = elements.length;
    for (let i = len - 1; i >= 0; i--) {
        const element = elements[i];
        if (selection.includes(element.id)) {
            if (element.type === 'frame') return null;
            continue;
        }
        if (element.type === 'frame') {
            const { x, y, width, height } = element;
            if (posX >= x && posX <= x + width && posY >= y && posY <= y + height) {
                return element?.id;
            }
        }
    }
    return null;
}
