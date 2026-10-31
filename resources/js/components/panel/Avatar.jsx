import { cn } from '../../lib/cn'

export function Avatar({ person, className }) {
    if (person.avatar) {
        return <img src={person.avatar} alt="" className={cn('size-5 shrink-0 rounded-full object-cover', className)} />
    }

    return <span className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[0.625rem] font-semibold text-zinc-700', className)}>{person.initial}</span>
}
