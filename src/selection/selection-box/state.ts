import { selectionBoxConfig } from "..";
import { createWithEqualityFn } from "zustand/traditional";
import { createStoreUtils } from "@/utils/createStoreUtils";
import { Node } from "../types/geometry"
import { SelectionBoxConfig, SelectionBoxState } from "../types/selection"

interface ExtendedNode extends Node {
  id: string;
  scaleX: number;
  scaleY: number;
  selection: string[];
  frames: any;
}

interface ExtendedSelectionBoxState extends Omit<SelectionBoxState, 'nodes'> {
  renderDep: boolean;  // 渲染依赖
  nodes: ExtendedNode[];       // 渲染外框数据
  innerNodes: ExtendedNode[];  // 渲染内框数据
  config: SelectionBoxConfig[];    // 元素选框，配置文件
  isDragging: boolean; // 是否拖拽中
  dragNodeId: string;  // 拖拽的节点id
}

export const _selectionBoxState = createWithEqualityFn<ExtendedSelectionBoxState>()(() => ({
  renderDep: false,
  nodes: [],
  innerNodes: [],
  config: selectionBoxConfig,
  isDragging: false,
  dragNodeId: '',
}));

export const clearSelectionNodes = () => {
  setSelectionBoxState({
    nodes: [],
    innerNodes: [],
  });
};

export const changeSelectionRender = () => {
  setSelectionBoxState({
    renderDep: !getSelectionBoxState('renderDep'),
  });
};

export const {
  useStore: useSelectionBoxState,
  setState: setSelectionBoxState,
  getState: getSelectionBoxState,
} = createStoreUtils<ExtendedSelectionBoxState>(_selectionBoxState);