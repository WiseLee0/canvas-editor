// 选择相关的类型定义
import { WH, Node, BaseRect } from './geometry'

// 重新导出WH类型以便在selection模块中使用
export type { WH } from './geometry'

// 选择框配置接口
export interface SelectionBoxConfig {
    type: string;                 // 元素类型
    edgeListening?: boolean;      // 是否开启边的拖拽事件，默认开启
    anchorListening?: boolean;    // 是否开启锚点的拖拽事件，默认开启
    rotationListening?: boolean;  // 是否开启旋转事件，默认开启
    keepRatio?: boolean;          // 是否开启等比缩放，默认关闭
    minWH?: WH;                   // 最小尺寸限制，默认[-Infinity, -Infinity]
    maxWH?: WH;                   // 最大尺寸限制，默认[Infinity, Infinity]
}

// 悬停节点接口（扩展Node接口）
export interface HoverNode extends Node {
    [key: string]: any;
}

// 悬停选择框状态接口
export interface HoverSelectionRectState {
    node: HoverNode | null;       // 渲染框数据
    hotId: string;                // 当前热区id
}

// 幽灵选择框状态接口
export interface GhostSelectionRectState {
    node: BaseRect | null;        // 渲染框数据
}

// 选择框状态接口
export interface SelectionBoxState {
    selection: string[];          // 选中的元素id列表
    nodes: Node[];               // 节点数据列表
    x: number;                   // 选择框x坐标
    y: number;                   // 选择框y坐标
    width: number;               // 选择框宽度
    height: number;              // 选择框高度
    rotation: number;            // 选择框旋转角度
    show: boolean;               // 是否显示选择框
    [key: string]: any;
} 