import { Avatar } from '../panel/Avatar'
import { cn } from '../../lib/cn'

/**
 * Overlapping avatars: the first `max`, then a +N chip whose tooltip lists the rest. `people` are
 * `{ name, avatar?, initial? }`; each avatar's tooltip is its name.
 */
export function AvatarStack({ people = [], max = 3, className, avatarClassName }) {
    const shown = people.slice(0, max)
    const rest = people.slice(shown.length)
    const ring = 'ring-2 ring-white'

    return (
        <span className={cn('inline-flex items-center -space-x-1', className)}>
            {shown.map((person, index) => (
                <span key={person.id ?? `${person.name}-${index}`} title={person.name} className="inline-flex rounded-full">
                    <Avatar person={{ ...person, initial: person.initial ?? person.name?.charAt(0)?.toUpperCase() }} className={cn(ring, avatarClassName)} />
                </span>
            ))}
            {rest.length > 0 && (
                <span
                    title={rest.map((person) => person.name).join(', ')}
                    className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[0.5625rem] font-semibold text-zinc-600 tabular-nums', ring, avatarClassName)}
                >
                    +{rest.length}
                </span>
            )}
        </span>
    )
}
