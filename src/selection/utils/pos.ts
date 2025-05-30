import Konva from "konva";

export const getPointerAbosultePos = (stage: Konva.Stage, event: MouseEvent) => {
  const stageContainerRect = stage?.container()?.getBoundingClientRect();
  if (!stageContainerRect) {
    return stage?.getRelativePointerPosition();
  }
  const stageX = event.clientX - stageContainerRect.left;
  const stageY = event.clientY - stageContainerRect.top;
  const transform = stage.getAbsoluteTransform().copy().invert();
  return transform.point({
    x: stageX,
    y: stageY,
  });
};