export interface CavansEvents {
  'stage:clickBackground': () => void;
  'selection:update': () => void;
  'selection:dragStart': (data: { x: number, y: number }) => void;
  'selection:dragMove': (data: { dx: number, dy: number }) => void;
  'selection:dragEnd': () => void;
}