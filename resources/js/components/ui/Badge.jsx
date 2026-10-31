import { cn } from '../../lib/cn'

const TONES = {
    zinc: 'bg-zinc-100 text-zinc-600',
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
}

const ALIASES = { success: 'green', warning: 'amber', danger: 'red', gray: 'zinc', info: 'blue' }

export function Badge({ tone = 'zinc', className, children }) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-sm px-[0.3rem] text-[0.575rem] leading-[0.95rem] font-medium whitespace-nowrap', TONES[ALIASES[tone] ?? tone] ?? TONES.zinc, className)}>
            {children}
        </span>
    )
}
