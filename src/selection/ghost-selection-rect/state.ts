import { createWithEqualityFn } from "zustand/traditional";
import { createStoreUtils } from "@/utils/createStoreUtils";
import { GhostSelectionRectState } from "../types/selection"

export const _ghostSelectionRectState = createWithEqualityFn<GhostSelectionRectState>()(() => ({
    node: null,
}));

export const {
    useStore: useGhostSelectionRectState,
    setState: setGhostSelectionRectState,
    getState: getGhostSelectionRectState,
} = createStoreUtils<GhostSelectionRectState>(_ghostSelectionRectState);