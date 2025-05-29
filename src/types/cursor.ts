// 光标相关的类型定义

// 光标函数类型
export type CursorFunction = (rotation: number, flip: boolean, color: string) => string

// 光标键类型
export type CursorKey =
    | "none"
    | "ew-resize"
    | "ns-resize"
    | "nesw-resize"
    | "nwse-resize"
    | "nwse-rotate"
    | "nesw-rotate"
    | "senw-rotate"
    | "swne-rotate"; 