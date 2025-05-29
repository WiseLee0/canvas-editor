import { createWithEqualityFn } from "zustand/traditional";
import { createStoreUtils } from "@/utils/createStoreUtils";
import { HoverSelectionRectState } from "../types/selection"

export const _hoverSelectionRectState = createWithEqualityFn<HoverSelectionRectState>()(() => ({
    node: null,
    hotId: '',
}));

export const {
    useStore: useHoverSelectionRectState,
    setState: setHoverSelectionRectState,
    getState: getHoverSelectionRectState,
} = createStoreUtils<HoverSelectionRectState>(_hoverSelectionRectState);