import { canvasEvents } from "@/helpers/canvas-events";
import { changeSelectionRender, useDragBoxEvent, useGhostSelectionRectEvent, useHoverSelectionRectEvent, useSelectionBoxEvent } from "..";
import { useEffect } from "react";

export const useSelectionEvent = () => {
  useHoverSelectionRectEvent()
  useSelectionBoxEvent()
  useGhostSelectionRectEvent()
  useDragBoxEvent()

  useEffect(() => {
    canvasEvents.on('selection:update', () => {
      changeSelectionRender()
    })
  }, [])
}