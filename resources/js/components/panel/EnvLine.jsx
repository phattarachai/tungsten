import { cn } from '../../lib/cn'
import { TONE_DOT, TONE_INK } from '../../lib/tones'

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
            <span className={cn('flex items-center gap-1 text-[0.625rem] font-semibold', TONE_INK[env.tone] ?? TONE_INK.draft)}>
                <span className={cn('size-1.5 shrink-0 rounded-full', TONE_DOT[env.tone] ?? TONE_DOT.draft)} />
                {env.label}
            </span>
        </span>
    )
}
