import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'

const MARKS = {
    in: 'border-blue-300 bg-blue-50 text-blue-700',
    out: 'border-zinc-400 bg-white text-zinc-600',
    error: 'border-red-200 bg-red-50 text-red-700',
    system: 'border-zinc-300 bg-white text-zinc-500',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
}

const LABELS = {
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
}

export function Timeline({ empty = strings.noEvents, className, children }) {
    const items = [children].flat(Infinity).filter(Boolean)

    if (items.length === 0) {
        return <p className="py-6 text-center text-zinc-400">{empty}</p>
    }

    return <ol className={cn('relative grid gap-2 before:absolute before:top-2 before:bottom-2 before:left-[0.62rem] before:w-0.5 before:bg-zinc-200', className)}>{children}</ol>
}

export function TimelineEvent({ kind = 'out', icon: Icon, label, muted = false, children }) {
    if (kind === 'dot') {
        return (
            <li className="relative grid grid-cols-[1.3rem_minmax(0,1fr)] gap-2">
                <span className="z-[1] m-1 size-[0.8rem] rounded-full bg-zinc-300" />
                <div className="py-0.5 text-[0.6rem] text-zinc-600">{children}</div>
            </li>
        )
    }

    return (
        <li className="relative grid grid-cols-[1.3rem_minmax(0,1fr)] gap-2">
            <span className="z-[1] flex flex-col items-center gap-0.5">
                <span className={cn('grid size-[1.3rem] place-items-center rounded-full border-[1.5px]', MARKS[kind] ?? MARKS.out)}>
                    {Icon && <Icon className="size-[0.65rem]" />}
                </span>
                {label && (
                    <span className={cn('rounded-sm px-0.5 text-[0.5rem] leading-3 font-semibold whitespace-nowrap', LABELS[kind] ?? 'bg-zinc-100 text-zinc-600')}>{label}</span>
                )}
            </span>
            <div className={cn('min-w-0 rounded border border-zinc-200 px-2 py-1.5', muted ? 'bg-zinc-50' : 'bg-white')}>{children}</div>
        </li>
    )
}

export function TimelineDivider({ children }) {
    return (
        <li className="relative grid grid-cols-[1.3rem_minmax(0,1fr)] items-center gap-2 pt-1">
            <span className="z-[1] mx-auto size-2 rounded-full border-[1.5px] border-zinc-400 bg-zinc-100" />
            <span className="flex items-center gap-2 text-[0.625rem] font-semibold text-zinc-600">
                {children}
                <span className="h-0 flex-1 border-t border-dashed border-zinc-300" />
            </span>
        </li>
    )
}

export function TimelineHead({ time, children }) {
    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.62rem]">
            {time && <span className="text-zinc-500 tabular-nums">{time}</span>}
            {children}
        </div>
    )
}
