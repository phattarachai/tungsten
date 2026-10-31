import { Head, Link, usePage } from '@inertiajs/react'
import { ArrowUpRight } from 'lucide-react'

import { Icon, PageHeader } from '../components/ui'
import { AppLayout } from '../layouts/AppLayout'
import { strings } from '../lib/strings'

function Tile({ item }) {
    const body = (
        <>
            <span className="rounded bg-brand-50 p-1.5 text-brand-600">
                <Icon name={item.icon} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium text-zinc-900 group-hover:text-brand-600">{item.label}</span>
                {item.group && <span className="block text-[0.6875rem] text-zinc-400">{item.group}</span>}
            </span>
            {(item.external || item.legacy) && <ArrowUpRight className="size-3.5 shrink-0 text-zinc-400" />}
        </>
    )

    const className = 'group flex items-center gap-2.5 rounded border border-zinc-200 bg-white p-2.5 transition hover:border-brand'

    if (item.external || item.legacy) {
        return (
            <a href={item.url} target={item.external ? '_blank' : undefined} rel="noopener" className={className}>
                {body}
            </a>
        )
    }

    return (
        <Link href={item.url} prefetch className={className}>
            {body}
        </Link>
    )
}

export default function Home({ title, description }) {
    const { nav } = usePage().props

    const items = nav.flatMap((section) => section.items.filter((item) => !item.active).map((item) => ({ ...item, group: section.group })))

    return (
        <>
            <Head title={title} />
            <div className="space-y-3">
                <PageHeader title={title} description={description} />

                {items.length === 0 ? (
                    <div className="rounded border border-dashed border-zinc-200 bg-white p-8 text-center text-[0.8125rem] text-zinc-500">{strings.emptyPanel}</div>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
                        {items.map((item) => (
                            <Tile key={item.url} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

Home.layout = (page) => <AppLayout>{page}</AppLayout>
