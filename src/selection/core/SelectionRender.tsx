import { GhostSelectionRect, HoverSelectionRect, SelectionBoxRects } from ".."

export const SelectionRender = () => {
  return (
    <>
      <HoverSelectionRect />
      <SelectionBoxRects />
      <GhostSelectionRect />
    </>
  )
}