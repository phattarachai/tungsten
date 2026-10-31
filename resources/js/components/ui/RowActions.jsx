import { router } from '@inertiajs/react'

import { cn } from '../../lib/cn'
import { methodOf, urlOf } from '../../lib/href'

import { ActionMenu } from './ActionMenu'
import { IconButton } from './IconButton'
import { strings } from '../../lib/strings'

/**
 * An item runs its `onSelect`, or visits its `href` (a string or `{url, method}`).
 */
export function runAction(item) {
    return item.onSelect ?? (() => router.visit(urlOf(item.href), { method: methodOf(item.href) }))
}

export function firstAction(items = []) {
    const first = items.find((item) => !item.inline)

    return first && first.tone !== 'danger' ? first : null
}

export function RowActions({ items = [], title }) {
    const inline = items.filter((item) => item.inline)
    const menu = items.filter((item) => !item.inline)

    if (inline.length === 0) {
        return <MenuActions items={menu} title={title} />
    }

    return (
        <span className="inline-flex items-center gap-0.5">
            {inline.map((item) => (
                <IconButton key={item.label} icon={item.icon} label={title ? `${item.label} ${title}` : item.label} onClick={runAction(item)} />
            ))}
            <MenuActions items={menu} title={title} />
        </span>
    )
}

function MenuActions({ items, title }) {
    if (items.length === 0) {
        return null
    }

    if (items.length === 1 && items[0].tone !== 'danger') {
        const [item] = items

        return <IconButton icon={item.icon} label={title ? `${item.label} ${title}` : item.label} onClick={runAction(item)} />
    }

    return <ActionMenu items={items} title={title ? strings.actionsFor(title) : undefined} />
}

export function KeyAction({ action, className, children }) {
    if (!action) {
        return children
    }

    return (
        <button type="button" onClick={runAction(action)} title={action.label} className={cn('cursor-pointer text-left hover:text-brand-600 hover:underline', className)}>
            {children}
        </button>
    )
}
