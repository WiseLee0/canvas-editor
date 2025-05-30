import { createWithEqualityFn } from "zustand/traditional";
import { createStoreUtils } from "@/utils/createStoreUtils";
import { HoverSelectionState } from "../types/selection"

export const _hoverSelectionState = createWithEqualityFn<HoverSelectionState>()(() => ({
    node: null,
    hotId: '',
}));

export const {
    useStore: useHoverSelectionState,
    setState: setHoverSelectionState,
    getState: getHoverSelectionState,
} = createStoreUtils<HoverSelectionState>(_hoverSelectionState);