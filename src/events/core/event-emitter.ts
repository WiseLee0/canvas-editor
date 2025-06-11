import {
  EventHandler,
  EventMiddleware,
  EventConfig,
  EventListener,
  UnsubscribeFunction,
  BaseEvent,
} from '../types/base';

/**
 * 高级事件发射器
 * 支持中间件、优先级、异步处理等功能
 */
export class EventEmitter<TEvents extends Record<string, BaseEvent>> {
  private listeners: Map<keyof TEvents, Map<string, EventListener>> = new Map();
  private middlewares: EventMiddleware[] = [];
  private idCounter = 0;
  private maxListeners = 100;

  /**
   * 添加事件监听器
   */
  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
    config: EventConfig = {}
  ): UnsubscribeFunction {
    const id = this.generateId();
    const listener: EventListener<TEvents[K]> = {
      handler,
      config: {
        once: false,
        priority: 0,
        passive: false,
        ...config,
      },
      id,
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }

    const eventListeners = this.listeners.get(event)!;
    
    // 检查监听器数量限制
    if (eventListeners.size >= this.maxListeners) {
      console.warn(`事件 ${String(event)} 的监听器数量已达到最大限制 ${this.maxListeners}`);
    }

    eventListeners.set(id, listener);

    return () => this.off(event, id);
  }

  /**
   * 添加一次性事件监听器
   */
  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
    config: Omit<EventConfig, 'once'> = {}
  ): UnsubscribeFunction {
    return this.on(event, handler, { ...config, once: true });
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof TEvents>(event: K, id: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(id);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 移除所有事件监听器
   */
  removeAllListeners<K extends keyof TEvents>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 触发事件
   */
  async emit<K extends keyof TEvents>(
    event: K,
    payload: Omit<TEvents[K], 'type' | 'timestamp'>
  ): Promise<void> {
    const eventData: TEvents[K] = {
      type: event as string,
      timestamp: Date.now(),
      ...payload,
    } as TEvents[K];

    // 执行中间件
    if (this.middlewares.length > 0) {
      await this.executeMiddlewares(eventData);
    }

    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // 按优先级排序监听器
    const sortedListeners = Array.from(eventListeners.values()).sort(
      (a, b) => (b.config.priority || 0) - (a.config.priority || 0)
    );

    const promises: Promise<void>[] = [];

    for (const listener of sortedListeners) {
      try {
        if (listener.config.passive) {
          // 被动监听器异步执行，不等待结果
          Promise.resolve(listener.handler(eventData)).catch(error => {
            console.error(`被动事件监听器执行错误:`, error);
          });
        } else {
          // 主动监听器需要等待执行完成
          const result = listener.handler(eventData);
          if (result instanceof Promise) {
            promises.push(result);
          }
        }

        // 一次性监听器在执行后移除
        if (listener.config.once) {
          eventListeners.delete(listener.id);
        }
      } catch (error) {
        console.error(`事件监听器执行错误:`, error);
      }
    }

    // 等待所有主动监听器执行完成
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * 同步触发事件（不支持异步监听器）
   */
  emitSync<K extends keyof TEvents>(
    event: K,
    payload: Omit<TEvents[K], 'type' | 'timestamp'>
  ): void {
    const eventData: TEvents[K] = {
      type: event as string,
      timestamp: Date.now(),
      ...payload,
    } as TEvents[K];

    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // 按优先级排序监听器
    const sortedListeners = Array.from(eventListeners.values()).sort(
      (a, b) => (b.config.priority || 0) - (a.config.priority || 0)
    );

    for (const listener of sortedListeners) {
      try {
        const result = listener.handler(eventData);
        if (result instanceof Promise) {
          console.warn(`同步事件发射器不支持异步监听器`);
        }

        // 一次性监听器在执行后移除
        if (listener.config.once) {
          eventListeners.delete(listener.id);
        }
      } catch (error) {
        console.error(`事件监听器执行错误:`, error);
      }
    }
  }

  /**
   * 添加中间件
   */
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * 移除中间件
   */
  removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middlewares.indexOf(middleware);
    if (index > -1) {
      this.middlewares.splice(index, 1);
    }
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount<K extends keyof TEvents>(event: K): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): (keyof TEvents)[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * 设置最大监听器数量
   */
  setMaxListeners(n: number): void {
    this.maxListeners = n;
  }

  /**
   * 获取最大监听器数量
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `listener_${++this.idCounter}_${Date.now()}`;
  }

  /**
   * 执行中间件
   */
  private async executeMiddlewares(event: BaseEvent): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middlewares.length) return;
      
      const middleware = this.middlewares[index++];
      await middleware(event, next);
    };

    await next();
  }

  /**
   * 销毁事件发射器
   */
  destroy(): void {
    this.listeners.clear();
    this.middlewares.length = 0;
  }
} 