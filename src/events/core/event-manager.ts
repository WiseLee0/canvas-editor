import { EventEmitter } from './event-emitter';
import { AppEvents, EventHandler, EventConfig, UnsubscribeFunction, EventMiddleware } from '../types';

/**
 * 事件管理器
 * 提供全局事件管理和工具方法
 */
export class EventManager {
  private emitter: EventEmitter<AppEvents>;
  private debugMode = false;

  constructor() {
    this.emitter = new EventEmitter<AppEvents>();
    this.setupDebugMiddleware();
  }

  /**
   * 订阅事件
   */
  on<K extends keyof AppEvents>(
    event: K,
    handler: EventHandler<AppEvents[K]>,
    config?: EventConfig
  ): UnsubscribeFunction {
    return this.emitter.on(event, handler, config);
  }

  /**
   * 一次性订阅事件
   */
  once<K extends keyof AppEvents>(
    event: K,
    handler: EventHandler<AppEvents[K]>,
    config?: Omit<EventConfig, 'once'>
  ): UnsubscribeFunction {
    return this.emitter.once(event, handler, config);
  }

  /**
   * 触发事件
   */
  async emit<K extends keyof AppEvents>(
    event: K,
    payload: Omit<AppEvents[K], 'type' | 'timestamp'>
  ): Promise<void> {
    return this.emitter.emit(event, payload);
  }

  /**
   * 同步触发事件
   */
  emitSync<K extends keyof AppEvents>(
    event: K,
    payload: Omit<AppEvents[K], 'type' | 'timestamp'>
  ): void {
    return this.emitter.emitSync(event, payload);
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof AppEvents>(event: K, id: string): void {
    return this.emitter.off(event, id);
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners<K extends keyof AppEvents>(event?: K): void {
    return this.emitter.removeAllListeners(event);
  }

  /**
   * 获取监听器数量
   */
  listenerCount<K extends keyof AppEvents>(event: K): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): (keyof AppEvents)[] {
    return this.emitter.eventNames();
  }

  /**
   * 添加中间件
   */
  use(middleware: EventMiddleware): void {
    return this.emitter.use(middleware);
  }

  /**
   * 移除中间件
   */
  removeMiddleware(middleware: EventMiddleware): void {
    return this.emitter.removeMiddleware(middleware);
  }

  /**
   * 批量订阅事件
   */
  onMultiple<K extends keyof AppEvents>(
    events: K[],
    handler: EventHandler<AppEvents[K]>,
    config?: EventConfig
  ): UnsubscribeFunction {
    const unsubscribeFunctions = events.map(event => 
      this.on(event, handler, config)
    );

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }

  /**
   * 条件订阅事件
   */
  onWhen<K extends keyof AppEvents>(
    event: K,
    condition: (event: AppEvents[K]) => boolean,
    handler: EventHandler<AppEvents[K]>,
    config?: EventConfig
  ): UnsubscribeFunction {
    return this.on(event, (eventData) => {
      if (condition(eventData)) {
        handler(eventData);
      }
    }, config);
  }

  /**
   * 等待事件触发
   */
  waitFor<K extends keyof AppEvents>(
    event: K,
    timeout?: number
  ): Promise<AppEvents[K]> {
    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;

      const unsubscribe = this.once(event, (eventData) => {
        if (timer) {
          clearTimeout(timer);
        }
        resolve(eventData);
      });

      if (timeout && timeout > 0) {
        timer = setTimeout(() => {
          unsubscribe();
          reject(new Error(`等待事件 ${String(event)} 超时`));
        }, timeout);
      }
    });
  }

  /**
   * 事件流（基于 AsyncIterator）
   */
  stream<K extends keyof AppEvents>(event: K): AsyncIterable<AppEvents[K]> {
    const queue: AppEvents[K][] = [];
    const resolvers: Array<(value: IteratorResult<AppEvents[K]>) => void> = [];
    let isFinished = false;

    const unsubscribe = this.on(event, (eventData) => {
      if (resolvers.length > 0) {
        const resolver = resolvers.shift()!;
        resolver({ value: eventData, done: false });
      } else {
        queue.push(eventData);
      }
    });

    return {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<AppEvents[K]>> {
            if (queue.length > 0) {
              const value = queue.shift()!;
              return { value, done: false };
            }

            if (isFinished) {
              return { value: undefined, done: true };
            }

            return new Promise<IteratorResult<AppEvents[K]>>((resolve) => {
              resolvers.push(resolve);
            });
          },

          async return(): Promise<IteratorResult<AppEvents[K]>> {
            isFinished = true;
            unsubscribe();
            // 清理待处理的 resolvers
            resolvers.forEach(resolve => 
              resolve({ value: undefined, done: true })
            );
            resolvers.length = 0;
            return { value: undefined, done: true };
          }
        };
      }
    };
  }

  /**
   * 启用调试模式
   */
  enableDebug(): void {
    this.debugMode = true;
  }

  /**
   * 禁用调试模式
   */
  disableDebug(): void {
    this.debugMode = false;
  }

  /**
   * 获取事件统计信息
   */
  getEventStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.eventNames().forEach(eventName => {
      stats[String(eventName)] = this.listenerCount(eventName);
    });
    return stats;
  }

  /**
   * 设置最大监听器数量
   */
  setMaxListeners(n: number): void {
    this.emitter.setMaxListeners(n);
  }

  /**
   * 销毁事件管理器
   */
  destroy(): void {
    this.emitter.destroy();
  }

  /**
   * 设置调试中间件
   */
  private setupDebugMiddleware(): void {
    this.emitter.use((event, next) => {
      if (this.debugMode) {
        console.log(`[事件调试] ${event.type}:`, event);
      }
      next();
    });
  }
}

/**
 * 全局事件管理器实例
 */
export const eventManager = new EventManager(); 