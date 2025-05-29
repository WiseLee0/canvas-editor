import { Layer, Stage } from "react-konva";
import "./App.css";
import { RenderElements } from "./render";
import { useEffect, useRef } from "react";
import Konva from "konva";
import { getProjectState, setProjectState, useProjectState } from "@/store";
import { useSelectionEvent, changeSelectionRender, SelectionRender, setSelectionBoxState } from "./selection";

function App() {
  const stageRef = useRef<Konva.Stage>(null)
  const viewport = useProjectState('viewport')
  const x = viewport.x
  const y = viewport.y
  const scale = viewport.scale
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const viewport = getProjectState('viewport')
      const x = viewport.x
      const y = viewport.y
      const scale = viewport.scale
      if (e.ctrlKey) {
        const stage = stageRef.current!;

        // 获取鼠标在stage容器中的原始位置
        const rect = stage.container().getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 计算鼠标在世界坐标系中的位置（缩放前）
        const worldMouseX = (mouseX - x) / scale;
        const worldMouseY = (mouseY - y) / scale;

        // 计算新的缩放比例
        const newScale = e.deltaY > 0 ? scale * 0.95 : scale * 1.05;

        // 计算新的偏移量，使得鼠标下的世界坐标点保持不变
        const newX = mouseX - worldMouseX * newScale;
        const newY = mouseY - worldMouseY * newScale;

        setProjectState({
          viewport: {
            scale: newScale,
            x: newX,
            y: newY
          }
        });
        return;
      }
      // 普通滚动时平移画布
      const panSpeed = 0.7;
      setProjectState({
        viewport: {
          x: (x - e.deltaX * panSpeed),
          y: (y - e.deltaY * panSpeed),
          scale: scale
        }
      });
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])
  useEffect(() => {
    // 清洗数据
    const elements = getProjectState('elements')
    if (elements?.length) {
      for (const element of elements) {
        if (element.type === 'image' && element.scaleX !== 1) {
          element.width = element.width * element.scaleX
          element.height = element.height * element.scaleY
          element.scaleX = 1
          element.scaleY = 1
        }
        if (element?.elements?.length) {
          for (const child of element.elements) {
            if (child.type === 'image' && child.scaleX !== 1) {
              child.width = child.width * child.scaleX
              child.height = child.height * child.scaleY
              child.scaleX = 1
              child.scaleY = 1
            }
          }
        }
      }
      setProjectState({ elements })
      changeSelectionRender()
    }
  }, [])

  useEffect(() => {
    if (stageRef.current) {
      setSelectionBoxState({ stage: stageRef.current });
      (window as any).STARFLOW = {
        getProjectState
      }
    }
  }, [])

  useSelectionEvent()

  return <div>
    <div style={{ height: 50, width: '100%', backgroundColor: 'black', background: 'linear-gradient(45deg, #ff9a9e, #fad0c4, #a1c4fd, #c2e9fb)' }}></div>
    <Stage width={window.innerWidth} height={window.innerHeight - 50} ref={stageRef} scaleX={scale} scaleY={scale} x={x} y={y} >
      <Layer >
        <RenderElements />
        <SelectionRender />
      </Layer>
    </Stage>
  </div>;
}

export default App;
