import { EventEmitter } from './emitter';
import type { CavansEvents } from './interface';

export const canvasEvents = new EventEmitter<CavansEvents>();

export * from './hooks';