import { useEffect, useState } from 'react'

import { readStorage, writeStorage } from './browser'

const LEGACY_KEY = (panelId) => `panel-nav-collapsed:${panelId}`
const KEY = (panelId) => `panel-nav-folds:${panelId}`

/** The user's own choices, `{ [group]: folded }`; the older list of folded groups reads as `true` for each. */
function storedChoices(panelId) {
    try {
        const stored = readStorage(KEY(panelId))

        if (stored !== null) {
            return JSON.parse(stored)
        }

        const legacy = JSON.parse(readStorage(LEGACY_KEY(panelId)) ?? '[]')

        return Array.isArray(legacy) ? Object.fromEntries(legacy.map((group) => [group, true])) : {}
    } catch {
        return {}
    }
}

/**
 * Which sidebar groups are folded: the user's choice per group (kept per panel in localStorage), else the server's
 * default (`navigationGroups(['การตลาด' => ['collapsed' => true]])`). The group holding the active page shows open on
 * every page, unless the user folds it while there. Defaults render first, also on the server; choices once mounted.
 */
export function useCollapsedGroups(panelId, nav, url) {
    const [choices, setChoices] = useState({})
    const [heldShut, setHeldShut] = useState(null)
    const activeGroup = nav.find((section) => section.group && section.items.some((item) => item.active))?.group ?? null

    useEffect(() => setChoices(storedChoices(panelId)), [panelId])

    function isCollapsed(section) {
        if (!section.group) {
            return false
        }

        if (section.group === activeGroup && heldShut !== url) {
            return false
        }

        return choices[section.group] ?? Boolean(section.collapsed)
    }

    function toggle(section) {
        const folded = !isCollapsed(section)
        const next = { ...choices, [section.group]: folded }

        if (section.group === activeGroup) {
            setHeldShut(folded ? url : null)
        }

        setChoices(next)
        writeStorage(KEY(panelId), JSON.stringify(next))
    }

    return { isCollapsed, toggle }
}
