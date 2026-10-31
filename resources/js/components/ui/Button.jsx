import { Icon } from './Icon'
import { cn } from '../../lib/cn'

const TONES = {
    solid: {
        neutral: 'bg-zinc-800 text-white hover:bg-zinc-900',
        brand: 'bg-brand text-white hover:bg-brand-600',
        amber: 'bg-amber-500 text-white hover:bg-amber-600',
        blue: 'bg-blue-600 text-white hover:bg-blue-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    },
    outline: {
        neutral: 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50',
        brand: 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 [&_svg]:text-brand',
        amber: 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
        blue: 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
        danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
    },
    ghost: {
        neutral: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
        brand: 'text-brand hover:bg-brand-50',
        amber: 'text-amber-700 hover:bg-amber-50',
        blue: 'text-blue-700 hover:bg-blue-50',
        danger: 'text-red-600 hover:bg-red-50',
    },
}

const SHORTHANDS = { brand: ['solid', 'brand'], danger: ['solid', 'danger'] }

const SIZES = {
    sm: 'h-6 gap-1 px-2 text-xs',
    md: 'gap-1.5 px-3 py-1.5 text-[0.8125rem]',
}

export function Button({ variant = 'brand', tone, size = 'md', icon, iconEnd, className, type = 'button', children, ...props }) {
    const [fill, defaultTone] = SHORTHANDS[variant] ?? [variant, 'neutral']

    return (
        <button
            type={type}
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50',
                SIZES[size],
                TONES[fill][tone ?? defaultTone],
                className,
            )}
            {...props}
        >
            {icon && <Icon name={icon} className="size-4" />}
            {children}
            {iconEnd && <Icon name={iconEnd} className="size-4" />}
        </button>
    )
}
