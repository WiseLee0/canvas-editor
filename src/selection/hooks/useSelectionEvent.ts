import { useDragBoxEvent, useGhostSelectionRectEvent, useHoverSelectionRectEvent, useSelectionBoxEvent } from "..";

export const useSelectionEvent = () => {
  useHoverSelectionRectEvent()
  useSelectionBoxEvent()
  useGhostSelectionRectEvent()
  useDragBoxEvent()
}