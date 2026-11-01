import { cn } from '../../lib/cn'
import { number } from '../../lib/format'
import { strings } from '../../lib/strings'

// Written out so Tailwind sees them: a bar's fill, and a line's colour (the SVG strokes with currentColor).
const BAR_TONES = {
    brand: 'bg-brand/70 group-hover:bg-brand',
    zinc: 'bg-zinc-400 group-hover:bg-zinc-600',
    draft: 'bg-tone-draft-ink/70 group-hover:bg-tone-draft-ink',
    waiting: 'bg-tone-waiting-ink/70 group-hover:bg-tone-waiting-ink',
    todo: 'bg-tone-todo-ink/70 group-hover:bg-tone-todo-ink',
    active: 'bg-tone-active-ink/70 group-hover:bg-tone-active-ink',
    done: 'bg-tone-done-ink/70 group-hover:bg-tone-done-ink',
    canceled: 'bg-tone-canceled-ink/70 group-hover:bg-tone-canceled-ink',
    failed: 'bg-tone-failed-ink/70 group-hover:bg-tone-failed-ink',
}

const LINE_TONES = {
    brand: 'text-brand',
    zinc: 'text-zinc-500',
    draft: 'text-tone-draft-ink',
    waiting: 'text-tone-waiting-ink',
    todo: 'text-tone-todo-ink',
    active: 'text-tone-active-ink',
    done: 'text-tone-done-ink',
    canceled: 'text-tone-canceled-ink',
    failed: 'text-tone-failed-ink',
}

/** The labels under the axis: the first, the middle and the last point. */
function Ticks({ data }) {
    const marks = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])]

    return (
        <div className="flex justify-between text-[0.6875rem] text-zinc-400 tabular-nums">
            {marks.map((index) => (
                <span key={index}>{data[index]?.label}</span>
            ))}
        </div>
    )
}

function Bars({ data, highest, tone, tip }) {
    return data.map((point, index) => (
        <div key={`${point.label}-${index}`} title={tip(point)} className="group flex h-full flex-1 items-end">
            <div className={cn('w-full rounded-t-sm transition-colors', BAR_TONES[tone] ?? BAR_TONES.brand)} style={{ height: `${point.value > 0 ? Math.max(3, (point.value / highest) * 100) : 0}%` }} />
        </div>
    ))
}

function Line({ data, highest, tone, tip }) {
    const step = data.length > 1 ? 100 / (data.length - 1) : 0
    const points = data.map((point, index) => `${index * step},${100 - (point.value / highest) * 100}`).join(' ')

    return (
        <>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cn('absolute inset-0 size-full overflow-visible', LINE_TONES[tone] ?? LINE_TONES.brand)} aria-hidden="true">
                <polygon points={`0,100 ${points} 100,100`} className="fill-current opacity-10" />
                <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
            <div className="absolute inset-0 flex">
                {data.map((point, index) => (
                    <div key={`${point.label}-${index}`} title={tip(point)} className="h-full flex-1 hover:bg-zinc-900/5" />
                ))}
            </div>
        </>
    )
}

/**
 * A small chart over a series (clicks per day, orders per week): `data` is `[{ label, value }]` in order, drawn as
 * `bar`s or a `line` in a status `tone` (or `brand` / `zinc`). Hovering a point shows `label: value unit`; the first,
 * middle and last labels sit under the axis, the highest value above it. Plain divs and SVG — it renders on the server
 * and needs no chart library.
 */
export function Chart({ data = [], type = 'bar', tone = 'brand', height = '8rem', format = number, unit, empty = strings.noData, label, className }) {
    const highest = Math.max(0, ...data.map((point) => Number(point.value) || 0))
    const tip = (point) => [`${point.label}: ${format(point.value)}`, unit].filter(Boolean).join(' ')

    if (data.length === 0 || highest === 0) {
        return <p className={cn('py-6 text-center text-zinc-400', className)}>{empty}</p>
    }

    return (
        <figure className={cn('space-y-1', className)}>
            <div className="text-[0.6875rem] text-zinc-400 tabular-nums">{format(highest)}</div>
            <div role="img" aria-label={label} className={cn('relative flex items-end border-b border-zinc-200', type === 'bar' && 'gap-0.5')} style={{ height }}>
                {type === 'line' ? <Line data={data} highest={highest} tone={tone} tip={tip} /> : <Bars data={data} highest={highest} tone={tone} tip={tip} />}
            </div>
            <Ticks data={data} />
        </figure>
    )
}
