export * from './base';
export * from './canvas-events';
export * from './selection-events';

import { CanvasEvents } from './canvas-events';
import { InteractionEvents } from './selection-events';
import { BaseEvent } from './base';

/**
 * 所有应用事件的联合类型
 */
export type AppEvents = CanvasEvents & InteractionEvents & Record<string, BaseEvent>;

/**
 * 获取事件类型的工具类型
 */
export type EventType<T extends keyof AppEvents> = T;

/**
 * 获取事件参数的工具类型
 */
export type EventPayload<T extends keyof AppEvents> = AppEvents[T]; 