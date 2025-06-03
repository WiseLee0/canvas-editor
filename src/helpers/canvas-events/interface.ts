export interface CavansEvents {
  'stage:clickBackground': () => void;
  'selection:update': () => void;
  'selection:dragStart': (event: MouseEvent) => void;
  'selection:dragMove': (event: MouseEvent) => void;
  'selection:dragEnd': (event: MouseEvent) => void;
}