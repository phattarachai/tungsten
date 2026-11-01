import { ChevronDown, Info } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

import { cn, widthUnless } from '../../lib/cn'

const CONTROL =
    'rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[0.8125rem] text-zinc-900 transition placeholder:text-zinc-400 focus:border-brand focus:outline-none disabled:opacity-50'

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
    return <input className={cn(CONTROL, widthUnless(className), className)} {...props} />
}

export function Textarea({ className, ...props }) {
    return <textarea className={cn(CONTROL, widthUnless(className), 'min-h-20', className)} {...props} />
}

const SELECT_SIZES = {
    md: 'rounded-md py-1.5 pr-8 pl-3 text-[0.8125rem]',
    sm: 'h-6 min-w-20 rounded py-0 pr-7 pl-2 text-[0.6875rem]',
}

export function Select({ size = 'md', className, children, ...props }) {
    return (
        <span className={cn('relative', size === 'md' && widthUnless(className) ? 'flex w-full' : 'inline-flex')}>
            <select
                className={cn(
                    'appearance-none border border-zinc-300 bg-white text-zinc-900 tabular-nums transition focus:border-brand focus:outline-none disabled:opacity-50',
                    SELECT_SIZES[size],
                    size === 'md' && widthUnless(className),
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

const RADIO_LAYOUTS = {
    list: { group: 'divide-y divide-zinc-100 rounded-md border', row: 'px-2.5 py-1.5', chosen: 'bg-zinc-50' },
    cards: { group: 'grid gap-2 sm:grid-cols-2', row: 'rounded-md border border-zinc-200 px-3 py-2', chosen: 'border-brand ring-1 ring-brand' },
    inline: { group: 'flex flex-wrap gap-x-4 gap-y-1.5', row: '', chosen: '' },
}

/**
 * One choice among `options` (`{ value, label, description?, disabled? }`) as native radios, so Tab enters the group
 * and the arrow keys move within it. `layout`: `list` (bordered rows), `cards` (a grid of cards, the chosen one
 * ringed) or `inline`. `invalid` turns the frame red; put the message on the surrounding `FormField error`.
 */
export function RadioGroup({ options, value, onChange, name, layout = 'list', disabled = false, invalid = false, className, 'aria-label': ariaLabel }) {
    const fallbackName = useId()
    const look = RADIO_LAYOUTS[layout] ?? RADIO_LAYOUTS.list

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            className={cn(look.group, layout === 'list' && (invalid ? 'border-red-400' : 'border-zinc-200'), className)}
        >
            {options.map((option) => {
                const chosen = String(value) === String(option.value)
                const off = disabled || option.disabled

                return (
                    <label
                        key={option.value}
                        className={cn(
                            'flex items-start gap-2 text-xs',
                            look.row,
                            chosen && look.chosen,
                            layout === 'cards' && invalid && !chosen && 'border-red-400',
                            off ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                        )}
                    >
                        <input
                            type="radio"
                            name={name ?? fallbackName}
                            value={option.value}
                            checked={chosen}
                            disabled={off}
                            onChange={() => onChange(option.value)}
                            className="mt-0.5 shrink-0 accent-brand"
                        />
                        <span className="min-w-0">
                            <span className="block break-words text-zinc-800">{option.label}</span>
                            {option.description && <span className="block text-[0.6875rem] text-zinc-500">{option.description}</span>}
                        </span>
                    </label>
                )
            })}
        </div>
    )
}

/**
 * A checkbox with its label (and an optional `hint` under it). `onChange` gets the new checked state; `indeterminate`
 * shows the mixed state (a "select all" over a partial selection). `error` shows under it, as on a FormField.
 */
export function Checkbox({ checked = false, onChange, label, hint, error, indeterminate = false, disabled = false, id, className, ...props }) {
    const input = useRef(null)
    const fallbackId = useId()

    useEffect(() => {
        if (input.current) {
            input.current.indeterminate = indeterminate
        }
    }, [indeterminate])

    return (
        <div className={cn('space-y-1', className)}>
            <label htmlFor={id ?? fallbackId} className={cn('flex items-start gap-2 text-xs', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
                <input
                    ref={input}
                    id={id ?? fallbackId}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => onChange?.(event.target.checked)}
                    aria-invalid={error ? true : undefined}
                    aria-checked={indeterminate ? 'mixed' : undefined}
                    className={cn('mt-0.5 shrink-0 accent-brand', error && 'outline outline-1 outline-red-400')}
                    {...props}
                />
                {(label || hint) && (
                    <span className="min-w-0">
                        {label && <span className="block text-zinc-800">{label}</span>}
                        {hint && <span className="block text-[0.6875rem] text-zinc-500">{hint}</span>}
                    </span>
                )}
            </label>
            {error && <FieldMessage error={error} />}
        </div>
    )
}
