import { cn } from '../../lib/cn'
import { useCarriedQuery } from '../../lib/useQueryState'

import { Badge } from './Badge'
import { GroupedNav } from './GroupedNav'
import { PageHeader } from './PageHeader'
import { RecordPager } from './RecordPager'
import { strings } from '../../lib/strings'

export function RecordLayout({ title, subtitle, inactive = false, tabs, meta, actions, pager, wide = false, width = 'max-w-7xl', children }) {
    const carry = useCarriedQuery('history')

    return (
        <div className={cn('space-y-3', !wide && width)}>
            <PageHeader
                className="panel-record-head"
                title={
                    <span className="flex items-center gap-2">
                        {title}
                        {inactive && <Badge tone="red">{strings.inactive}</Badge>}
                    </span>
                }
                description={subtitle}
                actions={
                    meta || actions || pager ? (
                        <>
                            {meta}
                            {meta && actions && <span className="h-5 w-px bg-zinc-200" aria-hidden />}
                            {actions}
                            {pager && (
                                <>
                                    {(meta || actions) && <span className="h-5 w-px bg-zinc-200" aria-hidden />}
                                    <RecordPager previousUrl={carry(pager.previous_url)} nextUrl={carry(pager.next_url)} />
                                </>
                            )}
                        </>
                    ) : undefined
                }
            />
            <div className="grid items-start gap-3 lg:grid-cols-[11rem_minmax(0,1fr)]">
                <GroupedNav className="panel-record-tabs" items={tabs.map((tab) => ({ ...tab, href: carry(tab.href) }))} linkProps={{ preserveScroll: true }} />
                <div className="min-w-0">{children}</div>
            </div>
        </div>
    )
}
