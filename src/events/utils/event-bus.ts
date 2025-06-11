import { eventManager } from '../core/event-manager';
import { AppEvents, EventHandler, EventConfig, UnsubscribeFunction } from '../types';

/**
 * 事件总线 - 提供便捷的事件处理API
 */
export class EventBus {
  /**
   * 快速订阅选择相关事件
   */
  static onSelectionChange(
    handler: EventHandler<AppEvents['selection:change']>,
    config?: EventConfig
  ): UnsubscribeFunction {
    return eventManager.on('selection:change', handler, config);
  }

  /**
   * 快速订阅拖拽事件
   */
  static onDrag(
    startHandler?: EventHandler<AppEvents['drag:start']>,
    moveHandler?: EventHandler<AppEvents['drag:move']>,
    endHandler?: EventHandler<AppEvents['drag:end']>,
    config?: EventConfig
  ): UnsubscribeFunction {
    const unsubscribes: UnsubscribeFunction[] = [];

    if (startHandler) {
      unsubscribes.push(eventManager.on('drag:start', startHandler, config));
    }
    if (moveHandler) {
      unsubscribes.push(eventManager.on('drag:move', moveHandler, config));
    }
    if (endHandler) {
      unsubscribes.push(eventManager.on('drag:end', endHandler, config));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 快速订阅舞台事件
   */
  static onStage(
    clickHandler?: EventHandler<AppEvents['stage:click']>,
    backgroundClickHandler?: EventHandler<AppEvents['stage:clickBackground']>,
    config?: EventConfig
  ): UnsubscribeFunction {
    const unsubscribes: UnsubscribeFunction[] = [];

    if (clickHandler) {
      unsubscribes.push(eventManager.on('stage:click', clickHandler, config));
    }
    if (backgroundClickHandler) {
      unsubscribes.push(eventManager.on('stage:clickBackground', backgroundClickHandler, config));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 快速订阅视窗事件
   */
  static onViewport(
    changeHandler?: EventHandler<AppEvents['viewport:change']>,
    zoomHandler?: EventHandler<AppEvents['viewport:zoom']>,
    panHandler?: EventHandler<AppEvents['viewport:pan']>,
    config?: EventConfig
  ): UnsubscribeFunction {
    const unsubscribes: UnsubscribeFunction[] = [];

    if (changeHandler) {
      unsubscribes.push(eventManager.on('viewport:change', changeHandler, config));
    }
    if (zoomHandler) {
      unsubscribes.push(eventManager.on('viewport:zoom', zoomHandler, config));
    }
    if (panHandler) {
      unsubscribes.push(eventManager.on('viewport:pan', panHandler, config));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 快速订阅悬停事件
   */
  static onHover(
    enterHandler?: EventHandler<AppEvents['hover:enter']>,
    leaveHandler?: EventHandler<AppEvents['hover:leave']>,
    moveHandler?: EventHandler<AppEvents['hover:move']>,
    config?: EventConfig
  ): UnsubscribeFunction {
    const unsubscribes: UnsubscribeFunction[] = [];

    if (enterHandler) {
      unsubscribes.push(eventManager.on('hover:enter', enterHandler, config));
    }
    if (leaveHandler) {
      unsubscribes.push(eventManager.on('hover:leave', leaveHandler, config));
    }
    if (moveHandler) {
      unsubscribes.push(eventManager.on('hover:move', moveHandler, config));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 快速订阅变换事件
   */
  static onTransform(
    startHandler?: EventHandler<AppEvents['transform:start']>,
    moveHandler?: EventHandler<AppEvents['transform:move']>,
    endHandler?: EventHandler<AppEvents['transform:end']>,
    config?: EventConfig
  ): UnsubscribeFunction {
    const unsubscribes: UnsubscribeFunction[] = [];

    if (startHandler) {
      unsubscribes.push(eventManager.on('transform:start', startHandler, config));
    }
    if (moveHandler) {
      unsubscribes.push(eventManager.on('transform:move', moveHandler, config));
    }
    if (endHandler) {
      unsubscribes.push(eventManager.on('transform:end', endHandler, config));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 事件序列订阅 - 监听特定顺序的事件序列
   */
  static onEventSequence<T extends keyof AppEvents>(
    events: T[],
    handler: (sequence: Array<{eventType: T, eventData: AppEvents[T], timestamp: number}>) => void,
    options?: {
      timeout?: number;        // 序列超时时间(ms)
      partial?: boolean;       // 是否允许部分序列匹配
      reset?: boolean;         // 是否在完成后重置序列
      config?: EventConfig;
    }
  ): UnsubscribeFunction {
    const { timeout = 5000, partial = false, reset = true, config } = options || {};
    
    let sequenceState = {
      currentIndex: 0,
      collectedEvents: [] as Array<{eventType: T, eventData: AppEvents[T], timestamp: number}>,
      timeoutId: null as NodeJS.Timeout | null
    };

    const resetSequence = () => {
      sequenceState.currentIndex = 0;
      sequenceState.collectedEvents = [];
      if (sequenceState.timeoutId) {
        clearTimeout(sequenceState.timeoutId);
        sequenceState.timeoutId = null;
      }
    };

    const startTimeout = () => {
      if (sequenceState.timeoutId) {
        clearTimeout(sequenceState.timeoutId);
      }
      
      sequenceState.timeoutId = setTimeout(() => {
        // 序列超时
        if (partial && sequenceState.collectedEvents.length > 0) {
          handler([...sequenceState.collectedEvents]);
        }
        resetSequence();
      }, timeout);
    };

    // 订阅所有相关事件
    const unsubscribes = events.map(eventType =>
      eventManager.on(eventType, (eventData) => {
        const expectedEvent = events[sequenceState.currentIndex];
        
        if (eventType === expectedEvent) {
          // 正确的下一个事件
          sequenceState.collectedEvents.push({
            eventType,
            eventData,
            timestamp: Date.now()
          });
          
          sequenceState.currentIndex++;
          
          if (sequenceState.currentIndex === events.length) {
            // 序列完成
            handler([...sequenceState.collectedEvents]);
            if (reset) {
              resetSequence();
            }
          } else {
            // 继续等待下一个事件
            startTimeout();
          }
        } else if (eventType === events[0]) {
          // 重新开始序列
          resetSequence();
          sequenceState.collectedEvents.push({
            eventType,
            eventData,
            timestamp: Date.now()
          });
          sequenceState.currentIndex = 1;
          startTimeout();
        } else {
          // 错误的事件，重置序列
          resetSequence();
        }
      }, config)
    );

    return () => {
      resetSequence();
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 事件组合订阅 - 监听多个事件但独立处理
   */
  static onMultipleEvents<T extends keyof AppEvents>(
    events: T[],
    handler: (eventData: AppEvents[T], eventType: T) => void,
    config?: EventConfig
  ): UnsubscribeFunction {
    const unsubscribes = events.map(event =>
      eventManager.on(event, (eventData) => {
        handler(eventData, event);
      }, config)
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }

  /**
   * 防抖事件订阅
   */
  static onDebounced<T extends keyof AppEvents>(
    event: T,
    handler: EventHandler<AppEvents[T]>,
    delay: number = 300,
    config?: EventConfig
  ): UnsubscribeFunction {
    let timer: NodeJS.Timeout | undefined;

    return eventManager.on(event, (eventData) => {
      if (timer) {
        clearTimeout(timer);
      }
      
      timer = setTimeout(() => {
        handler(eventData);
      }, delay);
    }, config);
  }

  /**
   * 节流事件订阅
   */
  static onThrottled<T extends keyof AppEvents>(
    event: T,
    handler: EventHandler<AppEvents[T]>,
    delay: number = 100,
    config?: EventConfig
  ): UnsubscribeFunction {
    let lastTime = 0;

    return eventManager.on(event, (eventData) => {
      const now = Date.now();
      if (now - lastTime >= delay) {
        lastTime = now;
        handler(eventData);
      }
    }, config);
  }
} 