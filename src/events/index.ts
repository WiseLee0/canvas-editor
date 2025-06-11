// 导出类型定义
export * from './types';

// 导出核心模块
export { EventEmitter } from './core/event-emitter';
export { EventManager, eventManager } from './core/event-manager';

// 导出工具模块
export { EventBus } from './utils/event-bus';

// 简化的事件API
import { eventManager } from './core/event-manager';

/**
 * 统一的事件API
 */
export const events = {
  // 基本事件操作
  on: eventManager.on.bind(eventManager),
  once: eventManager.once.bind(eventManager),
  off: eventManager.off.bind(eventManager),
  emit: eventManager.emit.bind(eventManager),
  emitSync: eventManager.emitSync.bind(eventManager),
  
  // 工具方法
  removeAllListeners: eventManager.removeAllListeners.bind(eventManager),
  listenerCount: eventManager.listenerCount.bind(eventManager),
  eventNames: eventManager.eventNames.bind(eventManager),
  
  // 高级功能
  onMultiple: eventManager.onMultiple.bind(eventManager),
  onWhen: eventManager.onWhen.bind(eventManager),
  waitFor: eventManager.waitFor.bind(eventManager),
  stream: eventManager.stream.bind(eventManager),
  
  // 调试功能
  enableDebug: eventManager.enableDebug.bind(eventManager),
  disableDebug: eventManager.disableDebug.bind(eventManager),
  getStats: eventManager.getEventStats.bind(eventManager),
}; 