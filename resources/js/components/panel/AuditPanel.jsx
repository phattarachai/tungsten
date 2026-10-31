import { useEffect, useState } from 'react'

import { Badge } from '../ui'

import { Aside } from './Aside'
import { Avatar } from './Avatar'
import { strings } from '../../lib/strings'

const EVENT_TONES = { สร้าง: 'green', ลบ: 'red' }

function Change({ change }) {
    return (
        <li className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-2 py-0.5">
            <span className="truncate text-zinc-500" title={change.label}>
                {change.label}
            </span>
            <span className="min-w-0 break-words">
                {change.old !== '—' && <span className="text-zinc-400 line-through">{change.old}</span>}
                {change.old !== '—' && <span className="px-1 text-zinc-300">→</span>}
                <span className="text-zinc-900">{change.new}</span>
            </span>
        </li>
    )
}

function Session({ session }) {
    return (
        <li className="border-b border-zinc-100 px-3 py-2.5">
            <div className="flex items-center gap-2">
                <Avatar person={session.actor} />
                <span className="min-w-0 flex-1 truncate font-medium text-zinc-800">{session.actor.name}</span>
                <span className="shrink-0 text-[0.6875rem] text-zinc-400 tabular-nums">{session.at}</span>
            </div>
            {session.entries.map((entry, index) => (
                <div key={index} className="mt-1.5 pl-7">
                    {(entry.event !== 'แก้ไข' || entry.relation) && (
                        <div className="mb-0.5 flex min-w-0 items-center gap-1">
                            {entry.event !== 'แก้ไข' && <Badge tone={EVENT_TONES[entry.event]}>{entry.event}</Badge>}
                            {entry.relation && <Badge>{entry.relation}</Badge>}
                            {entry.context && <span className="truncate text-[0.6875rem] text-zinc-500">{entry.context}</span>}
                        </div>
                    )}
                    <ul className="text-[0.6875rem]">
                        {entry.changes.map((change) => (
                            <Change key={change.field} change={change} />
                        ))}
                    </ul>
                </div>
            ))}
        </li>
    )
}

function Skeleton() {
    return (
        <div className="space-y-3 p-3">
            {[0, 1, 2].map((row) => (
                <div key={row} className="space-y-1.5">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-100" />
                </div>
            ))}
        </div>
    )
}

function History({ url }) {
    const [sessions, setSessions] = useState(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const controller = new AbortController()

        fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
            .then((response) => (response.ok ? response.json() : Promise.reject(response)))
            .then((data) => setSessions(data.sessions))
            .catch((error) => error.name !== 'AbortError' && setFailed(true))

        return () => controller.abort()
    }, [url])

    if (failed) {
        return <p className="p-3 text-xs text-red-600">{strings.historyFailed}</p>
    }

    if (sessions === null) {
        return <Skeleton />
    }

    if (sessions.length === 0) {
        return <p className="p-3 text-xs text-zinc-400">{strings.historyEmpty}</p>
    }

    return (
        <ul>
            {sessions.map((session) => (
                <Session key={session.key} session={session} />
            ))}
        </ul>
    )
}

export function AuditPanel({ url, open, onClose, title = strings.editHistory, actions }) {
    return (
        <Aside open={open} title={title} actions={actions} onClose={onClose}>
            <History key={url} url={url} />
        </Aside>
    )
}
