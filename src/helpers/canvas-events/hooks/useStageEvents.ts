import { clearSelection } from "@/helpers/canvas"
import { canvasEvents } from ".."

export const useStageEvents = () => {
  const handleStageClickBackground = () => {
    clearSelection()
  }
  canvasEvents.on('stage:clickBackground', handleStageClickBackground)

  return () => {
    canvasEvents.off('stage:clickBackground', handleStageClickBackground)
  }
}
