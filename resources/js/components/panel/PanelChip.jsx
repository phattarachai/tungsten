import { Icon } from '../ui/Icon'
import { cn } from '../../lib/cn'

function Mark({ entry }) {
    if (entry.logo) {
        const mask = `url("${entry.logo}") center / contain no-repeat`

        return <span className="size-[62%] bg-current" style={{ mask, WebkitMask: mask }} aria-hidden="true" />
    }

    return entry.icon ? <Icon name={entry.icon} className="size-3.5" /> : entry.short
}

/**
 * A panel's coloured switcher chip with its mark, white on `entry.color`: the `logo` (a single-colour SVG URL, drawn
 * as a mask) when it has one, else its icon (a registered icon name), else its `short` letters.
 */
export function PanelChip({ entry, className }) {
    return (
        <span
            className={cn('grid size-6 shrink-0 place-items-center rounded-md text-[0.625rem] font-bold text-white', className)}
            style={{ background: entry.color }}
        >
            <Mark entry={entry} />
        </span>
    )
}
