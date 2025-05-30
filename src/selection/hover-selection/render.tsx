import { Rect } from 'react-konva';
import { useProjectState } from '@/store';
import { useHoverSelectionState } from '..';

export function HoverSelectionRect() {
  const node = useHoverSelectionState('node');
  const scale = useProjectState('viewport').scale;
  if (!node) return null;

  return (
    <Rect
      x={node?.x}
      y={node?.y}
      width={node?.width}
      height={node?.height}
      stroke={'#11B0FF'}
      rotation={node?.rotation}
      strokeWidth={2 / scale}
    />
  );
}
