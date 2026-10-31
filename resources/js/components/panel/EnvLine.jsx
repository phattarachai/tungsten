import { cn } from '../../lib/cn'

// Static so Tailwind sees every class; keys are the status tones (README → "Status tones").
const ENV_INK = {
    draft: 'text-tone-draft-ink',
    waiting: 'text-tone-waiting-ink',
    todo: 'text-tone-todo-ink',
    active: 'text-tone-active-ink',
    done: 'text-tone-done-ink',
    canceled: 'text-tone-canceled-ink',
    failed: 'text-tone-failed-ink',
}

const ENV_DOT = {
    draft: 'bg-tone-draft-ink',
    waiting: 'bg-tone-waiting-ink',
    todo: 'bg-tone-todo-ink',
    active: 'bg-tone-active-ink',
    done: 'bg-tone-done-ink',
    canceled: 'bg-tone-canceled-ink',
    failed: 'bg-tone-failed-ink',
}

/**
 * The brand label with the environment under it ("• UAT" in its tone's ink), or the label alone in production
 * (`panel.env` null). Used by the switcher head and the login page.
 */
export function BrandLabel({ label, env, className }) {
    if (!env) {
        return <span className={cn('truncate', className)}>{label}</span>
    }

    return (
        <span className={cn('flex min-w-0 flex-col leading-tight', className)}>
            <span className="truncate">{label}</span>
            <span className={cn('flex items-center gap-1 text-[0.625rem] font-semibold', ENV_INK[env.tone] ?? ENV_INK.draft)}>
                <span className={cn('size-1.5 shrink-0 rounded-full', ENV_DOT[env.tone] ?? ENV_DOT.draft)} />
                {env.label}
            </span>
        </span>
    )
}
