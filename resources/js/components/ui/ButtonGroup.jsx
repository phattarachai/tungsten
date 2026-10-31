import { Icon } from './Icon'
import { cn } from '../../lib/cn'

const SIZES = {
    md: { group: 'rounded-md p-0.5', button: 'rounded px-3 py-1 text-[0.8125rem]' },
    sm: { group: 'h-6 rounded p-px', button: 'rounded-[0.1875rem] px-2 text-[0.6875rem]' },
}

/**
 * Segmented choices; `size="sm"` is the 1.5rem toolbar height, for presets in a `FilterBar`.
 */
export function ButtonGroup({ options, value, onChange, size = 'md', className }) {
    return (
        <div className={cn('inline-flex max-w-full overflow-x-auto border border-zinc-300 bg-zinc-100', SIZES[size].group, className)} role="group">
            {options.map((option) => {
                const active = option.value === value

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={active}
                        className={cn(
                            'inline-flex shrink-0 items-center gap-1.5 font-medium whitespace-nowrap transition',
                            SIZES[size].button,
                            active
                                ? 'bg-white text-zinc-900 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-800',
                        )}
                    >
                        {option.icon && <Icon name={option.icon} className="size-3.5" />}
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
