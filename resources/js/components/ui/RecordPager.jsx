import { Link } from '@inertiajs/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'
import { linkProps } from '../../lib/href'

function Step({ href, label, icon: Icon, className }) {
    const base = cn('inline-flex h-[1.4rem] w-6 items-center justify-center', className)

    if (!href) {
        return (
            <span aria-disabled title={label} className={cn(base, 'text-zinc-300')}>
                <Icon className="size-4" />
            </span>
        )
    }

    return (
        <Link {...linkProps(href)} preserveScroll prefetch title={label} aria-label={label} className={cn(base, 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900')}>
            <Icon className="size-4" />
        </Link>
    )
}

export function RecordPager({ previousUrl, nextUrl, previousLabel = strings.previous, nextLabel = strings.next }) {
    return (
        <nav aria-label={strings.recordPager} className="inline-flex shrink-0 divide-x divide-zinc-200 overflow-hidden rounded-md border border-zinc-300 bg-white">
            <Step href={previousUrl} label={previousLabel} icon={ChevronLeft} />
            <Step href={nextUrl} label={nextLabel} icon={ChevronRight} />
        </nav>
    )
}
