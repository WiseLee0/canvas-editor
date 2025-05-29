import { Rect } from "react-konva";
import { useGhostSelectionRectState } from "..";
import { useProjectState } from "@/store";
export function GhostSelectionRect() {
    const node = useGhostSelectionRectState('node')
    const scale = useProjectState('viewport').scale
    if (!node) return null;

    return <Rect
        x={node?.x}
        y={node?.y}
        width={node?.width}
        height={node?.height}
        stroke={'#11B0FF'}
        fill={'rgba(17, 176, 255, 0.1)'}
        strokeWidth={1 / scale}
    />
}