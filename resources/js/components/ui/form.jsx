import { ChevronDown, Info } from 'lucide-react'

import { cn } from '../../lib/cn'

const CONTROL =
    'w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[0.8125rem] text-zinc-900 transition placeholder:text-zinc-400 focus:border-brand focus:outline-none disabled:opacity-50'

function FieldMessage({ error, hint }) {
    if (error) {
        return <p className="text-xs text-red-600">{error}</p>
    }

    return hint ? <p className="text-xs text-zinc-400">{hint}</p> : null
}

function FieldLabel({ label, info }) {
    return (
        <>
            {label}
            {info && (
                <span title={info} aria-label={info} className="ml-1 inline-flex cursor-help align-[-0.125em] text-zinc-400 hover:text-zinc-600">
                    <Info className="size-3.5" />
                </span>
            )}
        </>
    )
}

export function FormField({ label, error, hint, info, htmlFor, stacked = false, className, children }) {
    if (stacked || !label) {
        return (
            <div className={cn('space-y-1', className)}>
                {label && (
                    <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-600">
                        <FieldLabel label={label} info={info} />
                    </label>
                )}
                {children}
                <FieldMessage error={error} hint={hint} />
            </div>
        )
    }

    return (
        <div className={cn('grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-x-3', className)}>
            <label htmlFor={htmlFor} className="pt-2 text-xs font-medium text-zinc-600">
                <FieldLabel label={label} info={info} />
            </label>
            <div className="min-w-0 space-y-1">
                {children}
                <FieldMessage error={error} hint={hint} />
            </div>
        </div>
    )
}

export function Input({ className, ...props }) {
    return <input className={cn(CONTROL, className)} {...props} />
}

export function Textarea({ className, ...props }) {
    return <textarea className={cn(CONTROL, 'min-h-20', className)} {...props} />
}

const SELECT_SIZES = {
    md: 'w-full rounded-md py-1.5 pr-8 pl-3 text-[0.8125rem]',
    sm: 'h-6 min-w-20 rounded py-0 pr-7 pl-2 text-[0.6875rem]',
}

export function Select({ size = 'md', className, children, ...props }) {
    return (
        <span className={cn('relative', size === 'md' ? 'flex w-full' : 'inline-flex')}>
            <select
                className={cn(
                    'appearance-none border border-zinc-300 bg-white text-zinc-900 tabular-nums transition focus:border-brand focus:outline-none disabled:opacity-50',
                    SELECT_SIZES[size],
                    className,
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-zinc-500', size === 'md' ? 'right-2.5 size-3.5' : 'right-2 size-3')} />
        </span>
    )
}
