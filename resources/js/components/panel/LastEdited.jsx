import { History } from 'lucide-react'

import { cn } from '../../lib/cn'

import { Avatar } from './Avatar'
import { strings } from '../../lib/strings'

export function LastEdited({ last, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={last ? strings.lastEditedBy(last.name) : strings.editHistory}
            aria-pressed={active}
            className={cn('group inline-flex h-6 items-center gap-1.5 rounded px-1 text-[0.6875rem] whitespace-nowrap transition hover:text-zinc-800', active ? 'text-zinc-900' : 'text-zinc-500')}
        >
            {last ? (
                <>
                    <span className={cn('tabular-nums group-hover:underline', active && 'font-medium underline')}>{strings.editedAt(last.at)}</span>
                    <Avatar person={last} className="size-4 text-[0.5625rem]" />
                </>
            ) : (
                <>
                    <History className="size-3.5" />
                    <span className={cn('group-hover:underline', active && 'font-medium underline')}>{strings.history}</span>
                </>
            )}
        </button>
    )
}
