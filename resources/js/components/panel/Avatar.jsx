import { Zoomable } from '../ui/Lightbox'
import { cn } from '../../lib/cn'

/**
 * A person's photo, else their initial. `zoom` opens the photo full screen.
 */
export function Avatar({ person, zoom = false, className }) {
    if (person.avatar) {
        const photo = <img src={person.avatar} alt="" className={cn('size-5 shrink-0 rounded-full object-cover', className)} />

        return zoom ? <Zoomable src={person.avatar} alt={person.name} className="rounded-full">{photo}</Zoomable> : photo
    }

    return <span className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[0.625rem] font-semibold text-zinc-700', className)}>{person.initial}</span>
}
