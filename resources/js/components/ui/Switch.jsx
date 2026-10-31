import { cn } from '../../lib/cn'

export function Switch({ checked, onChange, disabled = false, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn('relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition disabled:opacity-50', checked ? 'bg-brand' : 'bg-zinc-300')}
        >
            <span className={cn('inline-block size-3 rounded-full bg-white shadow transition', checked ? 'translate-x-3.5' : 'translate-x-0.5')} />
        </button>
    )
}
