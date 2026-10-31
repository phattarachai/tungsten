import { CircleHelp } from 'lucide-react'

import { opensInPanel, useHelpPanel } from '../panel/helpContext'
import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'

export function HelpLink({ href, label = strings.readHelp, className }) {
    const help = useHelpPanel()

    if (!href) {
        return null
    }

    function onClick(event) {
        if (help && opensInPanel(event)) {
            event.preventDefault()
            help.open(href)
        }
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener"
            title={label}
            onClick={onClick}
            className={cn('inline-flex shrink-0 items-center align-middle text-zinc-400 transition hover:text-zinc-700', className)}
        >
            <CircleHelp className="size-3.5" />
        </a>
    )
}
