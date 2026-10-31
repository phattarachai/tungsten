import { cn } from '../../lib/cn'
import { TONE_INK } from '../../lib/tones'

function countClass(option, active) {
    if (active) {
        return 'text-zinc-300'
    }

    return TONE_INK[option.tone] ? cn('font-semibold', TONE_INK[option.tone]) : 'text-zinc-400'
}

/**
 * A row of count tabs. On a narrow toolbar it scrolls sideways (thin scrollbar on hover) instead of overflowing.
 * An option's `tone` (a status tone, e.g. `todo`) colours its count while the tab isn't the active one.
 */
export function Pills({ options, value, onChange, className }) {
    return (
        <div className={cn('panel-scroll inline-flex w-fit max-w-full min-w-0 overflow-x-auto overflow-y-hidden rounded border border-zinc-300 bg-white', className)} role="group">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    aria-pressed={option.value === value}
                    className={cn(
                        'shrink-0 border-r border-zinc-200 px-2 py-0.5 text-[0.6875rem] whitespace-nowrap last:border-r-0',
                        option.value === value ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:bg-zinc-100',
                    )}
                >
                    {option.label}
                    {option.count !== undefined && <span className={cn('ml-1 tabular-nums', countClass(option, option.value === value))}>{option.count}</span>}
                </button>
            ))}
        </div>
    )
}
