import { createWithEqualityFn } from "zustand/traditional";
import { createStoreUtils } from "./utils/createStoreUtils";
import { mockElements } from "./mock";
import { canvasEvents } from "@/helpers/canvas-events";

interface Element {
    id: string
    x: number
    y: number
    width: number
    height: number
    rotation: number
    [key: string]: any
}
interface ProjectState {
    elements: Element[]
    selection: string[]
    viewport: {
        x: number
        y: number
        scale: number
    }
}
const startX = mockElements.reduce((acc, cur) => {
    return Math.min(acc, cur.x)
}, Infinity)
const startY = mockElements.reduce((acc, cur) => {
    return Math.min(acc, cur.y)
}, Infinity)
export const _projectState = createWithEqualityFn<ProjectState>()(() => ({
    elements: mockElements,
    selection: [],
    viewport: {
        x: (startX - 2000) * 0.1,
        y: (startY - 2000) * 0.1,
        scale: 0.1,
    }
}));

export const {
    useStore: useProjectState,
    setState: _setProjectState,
    getState: getProjectState,
} = createStoreUtils<ProjectState>(_projectState);

// DEBUG模式
export const setProjectState = (state: Partial<ProjectState>) => {
    _setProjectState(state)
}


export const getElementById = (id: string, elements?: any[]) => {
    if (!elements || !elements.length) {
        elements = getProjectState('elements');
    }
    const findElement = (elements: any) => {
        for (const element of elements) {
            if (element.id === id) {
                return element;
            }
            if (element?.elements?.length) {
                const ele = findElement(element?.elements) as any;
                if (ele) {
                    return ele;
                }
            }
        }
        return null;
    };

    return findElement(elements);
};

export const updateElement = (id: string, changes: Partial<Element>) => {
    const element = getElementById(id)
    if (element) {
        Object.assign(element, changes)
        canvasEvents.emit('selection:update')
    }
}
