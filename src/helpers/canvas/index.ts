import { getProjectState, setProjectState } from "@/store"

export const clearSelection = () => {
    const { selection } = getProjectState()
    if (selection?.length) {
        setProjectState({ selection: [] })
    }
}
