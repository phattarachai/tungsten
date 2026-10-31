import { cn } from '../../lib/cn'

const TONES = {
    neutral: 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800',
    danger: 'text-zinc-400 hover:bg-red-50 hover:text-red-600',
}

export function IconButton({ icon: IconComponent, label, tone = 'neutral', className, type = 'button', ...props }) {
    return (
        <button type={type} title={label} aria-label={label} className={cn('inline-flex size-6 items-center justify-center rounded transition disabled:opacity-40', TONES[tone], className)} {...props}>
            <IconComponent className="size-3.5" />
        </button>
    )
}
