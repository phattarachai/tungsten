import { usePersistentState } from './usePersistentState'

export function useCollapsedGroups(panelId) {
    const [collapsed, setCollapsed] = usePersistentState(`panel-nav-collapsed:${panelId}`, [])

    function toggle(group) {
        setCollapsed(collapsed.includes(group) ? collapsed.filter((entry) => entry !== group) : [...collapsed, group])
    }

    return { isCollapsed: (group) => collapsed.includes(group), toggle }
}
