import { createWithEqualityFn } from "zustand/traditional";
import { createStoreUtils } from "@/utils/createStoreUtils";
import { Stage } from "konva/lib/Stage";

interface SelectionState {
  stage: Stage;
}

export const _selectionState = createWithEqualityFn<SelectionState>()(() => ({
  stage: null!,
}));


export const {
  useStore: useSelectionState,
  setState: setSelectionState,
  getState: getSelectionState,
} = createStoreUtils<SelectionState>(_selectionState);