import { getProjectState } from "@/store"
import _ from "lodash"
import { getTransform } from "./matrix"
import { Transform } from "konva/lib/Util"

export const getAbsoluteTrElementsByIds = (ids: string[]) => {
    const elements = getProjectState('elements')

    const findElement: any = (elements: any[], tr: Transform) => {
        const result: any[] = []
        for (const element of elements) {
            if (ids.includes(element.id)) {
                result.push({
                    ..._.cloneDeep(element),
                    tr: tr.multiply(getTransform(element))
                })
            }
            if (element?.elements?.length) {
                const ele = findElement(element.elements, getTransform(element))
                if (ele?.length) {
                    result.push(...ele)
                }
            }
        }
        return result
    }

    return findElement(elements, new Transform())
}