import { Check, Pencil, X } from 'lucide-react'

import { cn } from '../../lib/cn'

const TAG_ICONS = { pencil: Pencil }

const CURRENT_TONES = {
    zinc: {
        ring: 'border-zinc-600 text-zinc-600 ring-zinc-100',
        label: 'text-zinc-700',
        tag: 'bg-zinc-100 text-zinc-700',
    },
    amber: {
        ring: 'border-amber-600 text-amber-600 ring-amber-50',
        label: 'text-amber-700',
        tag: 'bg-amber-50 text-amber-700',
    },
    blue: {
        ring: 'border-blue-600 text-blue-600 ring-blue-50',
        label: 'text-blue-700',
        tag: 'bg-blue-50 text-blue-700',
    },
    green: {
        ring: 'border-green-700 text-green-700 ring-green-50',
        label: 'text-green-700',
        tag: 'bg-green-50 text-green-700',
    },
}

function Mark({ state, tone }) {
    if (state === 'done') {
        return (
            <span className="relative z-[1] mx-auto mb-1.5 grid size-[1.2rem] place-items-center rounded-full bg-zinc-700 text-white">
                <Check className="size-[0.65rem]" strokeWidth={3} />
            </span>
        )
    }

    if (state === 'end') {
        return (
            <span className="relative z-[1] mx-auto mb-1.5 grid size-[1.2rem] place-items-center rounded-full bg-green-700 text-white">
                <Check className="size-[0.65rem]" strokeWidth={3} />
            </span>
        )
    }

    if (state === 'cancel') {
        return (
            <span className="relative z-[1] mx-auto mb-1.5 grid size-[1.2rem] place-items-center rounded-full bg-red-600 text-white">
                <X className="size-[0.65rem]" strokeWidth={3} />
            </span>
        )
    }

    if (state === 'bypassed') {
        return <span className="relative z-[1] mx-auto mb-1.5 block size-[1.2rem] rounded-full border-[1.5px] border-dashed border-zinc-400 bg-white" />
    }

    if (state === 'current') {
        return (
            <span
                className={cn(
                    'relative z-[1] mx-auto mb-1.5 grid size-[1.2rem] place-items-center rounded-full border-2 bg-white ring-[0.2rem]',
                    CURRENT_TONES[tone]?.ring ?? CURRENT_TONES.blue.ring,
                )}
            >
                <span className="size-[0.3rem] rounded-full bg-current" />
            </span>
        )
    }

    return (
        <span className="relative z-[1] mx-auto mb-1.5 grid size-[1.2rem] place-items-center rounded-full border-[1.5px] border-zinc-300 bg-white text-zinc-400">
            <span className="size-[0.3rem] rounded-full bg-current" />
        </span>
    )
}

function labelClass(state, tone) {
    return (
        {
            current: cn('font-semibold', CURRENT_TONES[tone]?.label ?? CURRENT_TONES.blue.label),
            end: 'font-medium text-green-700',
            cancel: 'font-semibold text-red-700',
            todo: 'text-zinc-400',
            bypassed: 'text-zinc-400',
            skip: 'text-zinc-400 line-through',
        }[state] ?? 'font-medium text-zinc-700'
    )
}

function Tag({ tag, className }) {
    if (typeof tag === 'string') {
        return <span className={cn(className, 'inline-block')}>{tag}</span>
    }

    const Icon = TAG_ICONS[tag.icon]

    return (
        <span className={cn(className, 'inline-flex items-center gap-0.5 tabular-nums')} title={tag.title}>
            {tag.label}
            {Icon && <Icon className="size-[0.55rem] text-zinc-500" aria-label={tag.title} />}
        </span>
    )
}

function Step({ step, next }) {
    const solid = (step.state === 'done' || step.state === 'end') && next?.state !== 'bypassed'

    return (
        <li className={cn('relative px-1 text-center', step.state === 'skip' && 'opacity-55')}>
            {next && (
                <span
                    aria-hidden
                    className={cn(
                        'absolute top-[0.6rem] right-[calc(-50%+0.85rem)] left-[calc(50%+0.85rem)] border-t-2',
                        solid ? 'border-solid border-zinc-600' : 'border-dashed border-zinc-300',
                    )}
                />
            )}
            <Mark state={step.state} tone={step.tone} />
            <div className={cn('text-[0.62rem] leading-tight', labelClass(step.state, step.tone))}>{step.label}</div>
            {step.meta?.map((line, index) => (
                <div key={index} className={cn('text-[0.55rem] leading-snug tabular-nums', step.state === 'bypassed' ? 'text-zinc-400' : 'text-zinc-500')}>
                    {line}
                </div>
            ))}
            {step.tags?.map((tag, index) => (
                <Tag
                    key={index}
                    tag={tag}
                    className={cn(
                        'mt-0.5 rounded-sm px-1 text-[0.52rem]',
                        step.state === 'current' ? (CURRENT_TONES[step.tone]?.tag ?? CURRENT_TONES.blue.tag) : 'bg-zinc-100 text-zinc-600',
                    )}
                />
            ))}
        </li>
    )
}

export function Stepper({ steps, className }) {
    return (
        <div className={cn('overflow-x-auto overflow-y-hidden', className)}>
            <ol className="grid min-w-max auto-cols-[minmax(6.5rem,1fr)] grid-flow-col py-1 md:min-w-0">
                {steps.map((step, index) => (
                    <Step key={step.key} step={step} next={steps[index + 1]} />
                ))}
            </ol>
        </div>
    )
}
