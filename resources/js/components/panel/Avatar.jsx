import { useState } from 'react'

import { Zoomable } from '../ui/Lightbox'
import { cn } from '../../lib/cn'

/** The letter for an initials avatar: the first character, skipping a Thai leading vowel (เกศินี → ก). */
export function initialOf(name) {
    return String(name ?? '')
        .trim()
        .replace(/^[เแโใไ]/u, '')
        .charAt(0)
        .toUpperCase()
}

/**
 * A person's photo, else their initial (`person.initial`, or from `person.name`); a photo that fails to load (a dead
 * CDN or LINE link) falls back to the initial. `zoom` opens the photo full screen.
 */
export function Avatar({ person, zoom = false, className }) {
    const [failed, setFailed] = useState(null)

    if (person.avatar && failed !== person.avatar) {
        const photo = <img src={person.avatar} alt="" loading="lazy" onError={() => setFailed(person.avatar)} className={cn('size-5 shrink-0 rounded-full object-cover', className)} />

        return zoom ? <Zoomable src={person.avatar} alt={person.name} className="rounded-full">{photo}</Zoomable> : photo
    }

    return (
        <span className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[0.625rem] font-semibold text-zinc-700', className)}>
            {person.initial ?? initialOf(person.name)}
        </span>
    )
}
