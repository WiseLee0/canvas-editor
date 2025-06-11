import { BaseEvent } from './base';

/**
 * 舞台事件
 */
export interface StageEvents {
  'stage:created': StageCreatedEvent;
  'stage:destroyed': StageDestroyedEvent;
  'stage:ready': StageReadyEvent;
  'stage:click': StageClickEvent;
  'stage:clickBackground': StageClickBackgroundEvent;
  'stage:mousedown': StageMouseEvent;
  'stage:mousemove': StageMouseEvent;
  'stage:mouseup': StageMouseEvent;
  'stage:wheel': StageWheelEvent;
  'stage:resize': StageResizeEvent;
}

export interface StageCreatedEvent extends BaseEvent {
  type: 'stage:created';
  stage: any;
}

export interface StageDestroyedEvent extends BaseEvent {
  type: 'stage:destroyed';
  stage: any;
}

export interface StageReadyEvent extends BaseEvent {
  type: 'stage:ready';
  stage: any;
}

export interface StageClickEvent extends BaseEvent {
  type: 'stage:click';
  position: { x: number; y: number };
  originalEvent: MouseEvent;
  target?: any;
}

export interface StageClickBackgroundEvent extends BaseEvent {
  type: 'stage:clickBackground';
  position: { x: number; y: number };
}

export interface StageMouseEvent extends BaseEvent {
  type: 'stage:mousedown' | 'stage:mousemove' | 'stage:mouseup';
  position: { x: number; y: number };
  originalEvent: MouseEvent;
  target?: any;
}

export interface StageWheelEvent extends BaseEvent {
  type: 'stage:wheel';
  position: { x: number; y: number };
  delta: { x: number; y: number };
  originalEvent: WheelEvent;
}

export interface StageResizeEvent extends BaseEvent {
  type: 'stage:resize';
  size: { width: number; height: number };
}

/**
 * 视窗事件
 */
export interface ViewportEvents {
  'viewport:change': ViewportChangeEvent;
  'viewport:zoom': ViewportZoomEvent;
  'viewport:pan': ViewportPanEvent;
  'viewport:reset': ViewportResetEvent;
}

export interface ViewportChangeEvent extends BaseEvent {
  type: 'viewport:change';
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  oldViewport: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface ViewportZoomEvent extends BaseEvent {
  type: 'viewport:zoom';
  scale: number;
  oldScale: number;
  center: { x: number; y: number };
}

export interface ViewportPanEvent extends BaseEvent {
  type: 'viewport:pan';
  delta: { x: number; y: number };
  position: { x: number; y: number };
}

export interface ViewportResetEvent extends BaseEvent {
  type: 'viewport:reset';
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
}

/**
 * 渲染事件
 */
export interface RenderEvents {
  'render:beforeRender': RenderBeforeEvent;
  'render:afterRender': RenderAfterEvent;
  'render:layerUpdate': RenderLayerUpdateEvent;
}

export interface RenderBeforeEvent extends BaseEvent {
  type: 'render:beforeRender';
  elements: any[];
}

export interface RenderAfterEvent extends BaseEvent {
  type: 'render:afterRender';
  elements: any[];
  duration: number;
}

export interface RenderLayerUpdateEvent extends BaseEvent {
  type: 'render:layerUpdate';
  layerId: string;
  elements: any[];
}

/**
 * 所有画布事件类型
 */
export type CanvasEvents = StageEvents & ViewportEvents & RenderEvents; 