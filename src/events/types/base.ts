/**
 * 基础事件接口
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
  source?: string;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (event: T) => void | Promise<void>;

/**
 * 事件中间件类型
 */
export type EventMiddleware<T = any> = (
  event: T,
  next: () => void
) => void | Promise<void>;

/**
 * 事件配置
 */
export interface EventConfig {
  once?: boolean;
  priority?: number;
  passive?: boolean;
}

/**
 * 事件监听器信息
 */
export interface EventListener<T = any> {
  handler: EventHandler<T>;
  config: EventConfig;
  id: string;
}

/**
 * 事件取消订阅函数
 */
export type UnsubscribeFunction = () => void; 