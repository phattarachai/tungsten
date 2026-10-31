import { usePersistentState } from './usePersistentState'

export function useColumnVisibility(storageKey, columns) {
    const defaults = columns.filter((column) => column.hiddenByDefault).map((column) => column.key)
    const [hidden, setHidden] = usePersistentState(storageKey, defaults)

    function toggle(key) {
        setHidden(hidden.includes(key) ? hidden.filter((value) => value !== key) : [...hidden, key])
    }

    return {
        visible: columns.filter((column) => !hidden.includes(column.key)),
        hidden,
        toggle,
        reset: () => setHidden(defaults),
    }
}
