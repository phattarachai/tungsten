import { Icon } from '../ui/Icon'
import { cn } from '../../lib/cn'

/**
 * A panel's coloured switcher chip: its icon (a registered icon name) when it has one, else its `short` letters.
 */
export function PanelChip({ entry, className }) {
    return (
        <span
            className={cn('grid size-6 shrink-0 place-items-center rounded-md text-[0.625rem] font-bold text-white', className)}
            style={{ background: entry.color }}
        >
            {entry.icon ? <Icon name={entry.icon} className="size-3.5" /> : entry.short}
        </span>
    )
}
