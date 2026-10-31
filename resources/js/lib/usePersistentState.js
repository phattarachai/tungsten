import { useEffect, useState } from 'react'

import { readStorage, writeStorage } from './browser'

/**
 * `useState` kept in localStorage for per-viewer view preferences. Renders `fallback` first (also on the server),
 * then the stored value once mounted, so SSR and hydration agree.
 */
export function usePersistentState(key, fallback) {
    const [value, setValue] = useState(fallback)

    useEffect(() => {
        const stored = readStorage(key)

        if (stored === null) {
            return
        }

        try {
            setValue(JSON.parse(stored))
        } catch {
            // a stored value from an older shape — keep the fallback
        }
    }, [key])

    function update(next) {
        setValue(next)
        writeStorage(key, JSON.stringify(next))
    }

    return [value, update]
}
