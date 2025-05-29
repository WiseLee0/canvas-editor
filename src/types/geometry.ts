// 几何相关的类型定义

// 点坐标接口
export interface Point {
    x: number;
    y: number;
}

// 节点基础接口（包含位置、尺寸和旋转信息）
export interface Node {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

// 基础矩形接口（不包含旋转）
export interface BaseRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// 尺寸元组类型
export type WH = [number, number]

// 包围盒类型 [x, y, width, height]
export type BoundingBox = [number, number, number, number] 