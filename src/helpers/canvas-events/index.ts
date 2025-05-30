import { EventEmitter } from './emitter';
import type { CavansEvents } from './interface';

// @ts-ignore 忽略类型错误
export const canvasEvents = new EventEmitter<CavansEvents>();