import { BaseEvent } from './base';

/**
 * 选择事件
 */
export interface SelectionEvents {
  'selection:change': SelectionChangeEvent;
  'selection:update': SelectionUpdateEvent;
  'selection:clear': SelectionClearEvent;
  'selection:add': SelectionAddEvent;
  'selection:remove': SelectionRemoveEvent;
  'selection:focus': SelectionFocusEvent;
  'selection:blur': SelectionBlurEvent;
}

export interface SelectionChangeEvent extends BaseEvent {
  type: 'selection:change';
  selectedIds: string[];
  previousSelectedIds: string[];
  addedIds: string[];
  removedIds: string[];
}

export interface SelectionUpdateEvent extends BaseEvent {
  type: 'selection:update';
  selectedIds: string[];
}

export interface SelectionClearEvent extends BaseEvent {
  type: 'selection:clear';
  previousSelectedIds: string[];
}

export interface SelectionAddEvent extends BaseEvent {
  type: 'selection:add';
  addedIds: string[];
  selectedIds: string[];
}

export interface SelectionRemoveEvent extends BaseEvent {
  type: 'selection:remove';
  removedIds: string[];
  selectedIds: string[];
}

export interface SelectionFocusEvent extends BaseEvent {
  type: 'selection:focus';
  elementId: string;
}

export interface SelectionBlurEvent extends BaseEvent {
  type: 'selection:blur';
  elementId: string;
}

/**
 * 拖拽事件
 */
export interface DragEvents {
  'drag:start': DragStartEvent;
  'drag:move': DragMoveEvent;
  'drag:end': DragEndEvent;
  'drag:enter': DragEnterEvent;
  'drag:leave': DragLeaveEvent;
  'drag:over': DragOverEvent;
  'drag:drop': DragDropEvent;
}

export interface DragStartEvent extends BaseEvent {
  type: 'drag:start';
  elementIds: string[];
  startPosition: { x: number; y: number };
  originalEvent: MouseEvent;
}

export interface DragMoveEvent extends BaseEvent {
  type: 'drag:move';
  elementIds: string[];
  currentPosition: { x: number; y: number };
  delta: { x: number; y: number };
  originalEvent: MouseEvent;
}

export interface DragEndEvent extends BaseEvent {
  type: 'drag:end';
  elementIds: string[];
  finalPosition: { x: number; y: number };
  totalDelta: { x: number; y: number };
  originalEvent: MouseEvent;
}

export interface DragEnterEvent extends BaseEvent {
  type: 'drag:enter';
  draggedIds: string[];
  targetId: string;
  position: { x: number; y: number };
}

export interface DragLeaveEvent extends BaseEvent {
  type: 'drag:leave';
  draggedIds: string[];
  targetId: string;
  position: { x: number; y: number };
}

export interface DragOverEvent extends BaseEvent {
  type: 'drag:over';
  draggedIds: string[];
  targetId: string;
  position: { x: number; y: number };
}

export interface DragDropEvent extends BaseEvent {
  type: 'drag:drop';
  draggedIds: string[];
  targetId: string;
  position: { x: number; y: number };
}

/**
 * 悬停事件
 */
export interface HoverEvents {
  'hover:enter': HoverEnterEvent;
  'hover:leave': HoverLeaveEvent;
  'hover:move': HoverMoveEvent;
}

export interface HoverEnterEvent extends BaseEvent {
  type: 'hover:enter';
  elementId: string;
  position: { x: number; y: number };
}

export interface HoverLeaveEvent extends BaseEvent {
  type: 'hover:leave';
  elementId: string;
  position: { x: number; y: number };
}

export interface HoverMoveEvent extends BaseEvent {
  type: 'hover:move';
  elementId: string;
  position: { x: number; y: number };
}

/**
 * 变换事件
 */
export interface TransformEvents {
  'transform:start': TransformStartEvent;
  'transform:move': TransformMoveEvent;
  'transform:end': TransformEndEvent;
  'transform:resize': TransformResizeEvent;
  'transform:rotate': TransformRotateEvent;
  'transform:scale': TransformScaleEvent;
}

export interface TransformStartEvent extends BaseEvent {
  type: 'transform:start';
  elementIds: string[];
  transformType: 'resize' | 'rotate' | 'scale' | 'move';
  startPosition: { x: number; y: number };
}

export interface TransformMoveEvent extends BaseEvent {
  type: 'transform:move';
  elementIds: string[];
  transformType: 'resize' | 'rotate' | 'scale' | 'move';
  currentPosition: { x: number; y: number };
  delta: { x: number; y: number };
}

export interface TransformEndEvent extends BaseEvent {
  type: 'transform:end';
  elementIds: string[];
  transformType: 'resize' | 'rotate' | 'scale' | 'move';
  finalTransform: any;
}

export interface TransformResizeEvent extends BaseEvent {
  type: 'transform:resize';
  elementId: string;
  newSize: { width: number; height: number };
  oldSize: { width: number; height: number };
}

export interface TransformRotateEvent extends BaseEvent {
  type: 'transform:rotate';
  elementId: string;
  newRotation: number;
  oldRotation: number;
  center: { x: number; y: number };
}

export interface TransformScaleEvent extends BaseEvent {
  type: 'transform:scale';
  elementId: string;
  newScale: { x: number; y: number };
  oldScale: { x: number; y: number };
  center: { x: number; y: number };
}

/**
 * 所有交互事件类型
 */
export type InteractionEvents = SelectionEvents & DragEvents & HoverEvents & TransformEvents; 