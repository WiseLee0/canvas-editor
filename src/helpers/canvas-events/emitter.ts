type EventHandler<T = any> = (payload: T) => void;
type EventMap = Record<string, EventHandler>;

export class EventEmitter<TEvents extends EventMap = {}> {
  private events: {
    [K in keyof TEvents]?: Set<TEvents[K]>;
  } = {};

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  on<K extends keyof TEvents>(event: K, handler: TEvents[K]): () => void {
    if (!this.events[event]) {
      this.events[event] = new Set();
    }
    this.events[event]!.add(handler);

    // 返回取消订阅的函数
    return () => this.off(event, handler);
  }

  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  off<K extends keyof TEvents>(event: K, handler: TEvents[K]): void {
    if (this.events[event]) {
      this.events[event]!.delete(handler);
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param payload 事件数据
   */
  emit<K extends keyof TEvents>(event: K, payload?: Parameters<TEvents[K]>[0]): void {
    if (this.events[event]) {
      this.events[event]!.forEach(handler => handler(payload as any));
    }
  }

  /**
   * 一次性订阅
   * @param event 事件名称
   * @param handler 事件处理函数
   */
  once<K extends keyof TEvents>(event: K, handler: TEvents[K]): void {
    const onceHandler = (payload: any) => {
      handler(payload);
      this.off(event, onceHandler as TEvents[K]);
    };
    this.on(event, onceHandler as TEvents[K]);
  }

  /**
   * 清除所有事件监听
   */
  clear(): void {
    this.events = {};
  }
}