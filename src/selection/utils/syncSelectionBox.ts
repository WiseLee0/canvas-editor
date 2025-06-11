import { getProjectState } from "@/store"
import { getPointsBoundingBox, getRotatedRectangleCorners, clearSelectionNodes, setSelectionBoxState } from ".."
import _ from "lodash"

// 强制计算选择框
export const syncSelectionBox = () => {
  const selection = getProjectState('selection')
  if (!selection?.length) {
    clearSelectionNodes()
    return
  }
  const elements = getProjectState('elements')
  // 获取选中的Nodes
  const nodes = getSelectionNodes(selection, elements) as any[]
  // 扁平化Nodes
  const flatNodes = splitFrameLevelNodes(nodes)
  // 合并Nodes
  const boxs = mergeToBoxs(flatNodes) as any[]

  setSelectionBoxState({ nodes: boxs, innerNodes: nodes })
}

const getSelectionNodes = (selection: string[], elements: any[]) => {
  const node = []
  for (const element of elements) {
    if (selection.includes(element.id)) {
      node.push(element)
    }
    if (element?.elements) {
      const nodes = getSelectionNodes(selection, element.elements) as any[];
      if (nodes.length) {
        if (element.type === 'frame') {
          nodes.forEach(item => {
            item.x = item.x + element.x
            item.y = item.y + element.y
            item.__parentType = 'frame'
            item.__parentId = element.id
          })
        }
        if (element.type === 'group') {
          nodes.forEach(item => {
            item.x = item.x + element.x
            item.y = item.y + element.y
            item.__parentType = 'group'
            item.__parentId = element.id
          })
        }
        node.push(...nodes)
      }
    }
  }
  return _.cloneDeep(node)
}



const splitFrameLevelNodes = (nodes: any) => {
  const result = {
    'elements': [],
  } as any
  for (const node of nodes) {
    const parentId = node.__parentId
    const parentType = node.__parentType
    if (!parentId || parentType !== 'frame') {
      result['elements'].push(node)
    } else {
      if (!result[parentId]) {
        result[parentId] = []
      }
      result[parentId].push(node)
    }
  }

  return Object.values(result).filter((item: any) => item?.length) as any[][]
}

const mergeToBoxs = (nodesArr: any[][]) => {
  // 如果只有一个元素被选中，则不合并
  if (nodesArr.length === 1 && nodesArr[0].length === 1) {
    const node = nodesArr[0][0]
    const frames = {} as any
    if (node.__parentId && node.__parentType === 'frame') {
      frames[node.id] = node.__parentId
    }
    return [{
      id: 'box-0',
      selection: [node.id],
      frames,
      x: node.x,
      y: node.y,
      width: node.width * (node?.scaleX || 1),
      height: node.height * (node?.scaleY || 1),
      rotation: node.rotation
    }];
  }
  // 如果多个元素被选中，则合并
  const newNodes = []
  for (const nodes of nodesArr) {
    const selection = []
    const frames = {} as any
    const points: { x: number, y: number }[] = []
    for (const node of nodes) {
      selection.push(node.id)
      if (node.__parentId && node.__parentType === 'frame') {
        frames[node.id] = node.__parentId
      }
      if (!node?.rotation) {
        const width = node.width * (node?.scaleX || 1)
        const height = node.height * (node?.scaleY || 1)
        points.push({ x: node.x, y: node.y })
        points.push({ x: node.x + width, y: node.y })
        points.push({ x: node.x, y: node.y + height })
        points.push({ x: node.x + width, y: node.y + height })
      } else {
        points.push(...getRotatedRectangleCorners(node))
      }
    }
    const box = getPointsBoundingBox(points)
    newNodes.push({
      id: `box-${newNodes.length}`,
      selection,
      frames,
      x: box[0],
      y: box[1],
      width: box[2],
      height: box[3],
      rotation: 0
    })
  }
  return newNodes
}