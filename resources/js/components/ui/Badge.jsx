import { TriangleAlert } from 'lucide-react'

import { cn } from '../../lib/cn'

const TONES = {
    zinc: 'bg-zinc-100 text-zinc-600',
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',

    // Status tones, named by what the status means (README → "Status tones"); colours are the --color-tone-* tokens.
    draft: 'bg-tone-draft text-tone-draft-ink',
    waiting: 'bg-tone-waiting text-tone-waiting-ink',
    todo: 'bg-tone-todo text-tone-todo-ink',
    active: 'bg-tone-active text-tone-active-ink',
    done: 'bg-tone-done text-tone-done-ink',
    canceled: 'bg-tone-canceled text-tone-canceled-ink',
    failed: 'bg-tone-failed text-tone-failed-ink font-semibold',
}

const ALIASES = { success: 'green', warning: 'amber', danger: 'red', gray: 'zinc', info: 'blue' }

export function Badge({ tone = 'zinc', className, children }) {
    const key = ALIASES[tone] ?? tone

    return (
        <span className={cn('inline-flex items-center gap-1 rounded-sm px-[0.3rem] text-[0.575rem] leading-[0.95rem] font-medium whitespace-nowrap', TONES[key] ?? TONES.zinc, className)}>
            {key === 'failed' && <TriangleAlert className="size-2.5 shrink-0" aria-hidden="true" />}
            {children}
        </span>
    )
}
