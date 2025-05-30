export interface CavansEvents {
  'stage:clickBackground': () => void;
  [key: string]: (...args: any[]) => void;
}