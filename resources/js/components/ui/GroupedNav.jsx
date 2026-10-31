import { cn } from '../../lib/cn'

import { Icon } from './Icon'
import { NavList } from './NavList'

function groupItems(items) {
    return items.reduce((groups, { group, ...item }) => {
        const last = groups.at(-1)

        if (last && last.key === (group?.key ?? null)) {
            last.items.push(item)

            return groups
        }

        return [...groups, { key: group?.key ?? null, label: group?.label, icon: group?.icon, items: [item] }]
    }, [])
}

export function GroupedNav({ items, linkProps, className }) {
    return (
        <div className={cn('panel-scroll space-y-2 lg:sticky lg:top-13 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto', className)}>
            {groupItems(items).map((group) => (
                <div key={group.key ?? 'items'} className="rounded border border-zinc-200 bg-white">
                    {group.label && (
                        <div className="flex items-center gap-1.5 px-3 pt-2 pb-0.5 text-[0.6875rem] font-semibold text-zinc-500">
                            {group.icon && <Icon name={group.icon} className="size-3.5 text-zinc-400" />}
                            {group.label}
                        </div>
                    )}
                    <NavList items={group.items} linkProps={linkProps} />
                </div>
            ))}
        </div>
    )
}
