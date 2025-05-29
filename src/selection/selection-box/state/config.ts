import { WH, SelectionBoxConfig } from '../../../types/selection'

export const selectionBoxConfig = [{
    type: 'shape_square',
    minWH: [1, 1] as WH,
}, {
    type: 'frame',
    minWH: [1, 1] as WH,
    rotationListening: false,
}, {
    type: 'shape_circle',
    minWH: [1, 1] as WH,
}, {
    type: 'image',
    minWH: [1, 1] as WH,
    maxWH: [8192, 8192] as WH,
    rotationListening: false,
    keepRatio: true,
}]

export const getSelectionBoxConfig = (type: string): SelectionBoxConfig => {
    const config = selectionBoxConfig.find(c => c.type === type)
    return {
        type,
        edgeListening: true,
        anchorListening: true,
        rotationListening: true,
        keepRatio: false,
        minWH: [-Infinity, -Infinity] as WH,
        maxWH: [Infinity, Infinity] as WH,
        ...config,
    }
}