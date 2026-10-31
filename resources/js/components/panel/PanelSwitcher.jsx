import { usePage } from '@inertiajs/react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '../../lib/cn'

import { PanelChip } from './PanelChip'
import { urlOf } from '../../lib/href'

function useCloseOnOutside(details) {
    useEffect(() => {
        function close(event) {
            const element = details.current

            if (element?.open && (event.type === 'keydown' ? event.key === 'Escape' : !element.contains(event.target))) {
                element.open = false
            }
        }

        document.addEventListener('mousedown', close)
        document.addEventListener('keydown', close)

        return () => {
            document.removeEventListener('mousedown', close)
            document.removeEventListener('keydown', close)
        }
    }, [details])
}

function ReplacementButton({ entry }) {
    return (
        <a
            href={urlOf(entry.url)}
            title={`${entry.label} — ${entry.description}`}
            className={cn('mr-1 shrink-0 self-center rounded-md p-0.5 hover:bg-zinc-100', entry.current && 'ring-2 ring-brand-600 ring-offset-1')}
        >
            <PanelChip entry={entry} />
        </a>
    )
}

function PanelRow({ entry, replacements }) {
    return (
        <div className={cn('flex items-stretch rounded hover:bg-zinc-50', entry.current && 'bg-brand-50 hover:bg-brand-50')}>
            <a href={urlOf(entry.url)} className="flex min-w-0 flex-1 items-start gap-2.5 px-2 py-1.5">
                <PanelChip entry={entry} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[0.8125rem] font-medium text-zinc-900">
                        <span className="truncate">{entry.label}</span>
                        {entry.current && <Check className="size-3.5 text-brand-600" />}
                    </span>
                    <span className="block truncate text-[0.6875rem] text-zinc-500">{entry.description}</span>
                </span>
            </a>
            {replacements.map((replacement) => (
                <ReplacementButton key={replacement.id} entry={replacement} />
            ))}
        </div>
    )
}

export function PanelSwitcher({ compact = false }) {
    const { panels = [], panel } = usePage().props
    const details = useRef(null)
    const current = panels.find((entry) => entry.current)
    const brand = panel?.brand

    useCloseOnOutside(details)

    if (!current) {
        return null
    }

    return (
        <details ref={details} className={cn('group relative', !compact && 'w-full')}>
            <summary
                className={cn(
                    'flex cursor-pointer list-none items-center gap-2 rounded-md text-[0.8125rem] font-semibold',
                    compact ? 'border border-zinc-200 px-1.5 py-0.5 text-zinc-800 hover:bg-topbar-hover' : 'w-full px-2 py-1.5 text-rail-ink-active hover:bg-rail-hover',
                )}
            >
                <PanelChip entry={brand ? { ...current, icon: brand.icon, logo: brand.logo } : current} className={compact ? 'size-5 text-[0.5625rem]' : undefined} />
                <span className="truncate">{brand?.label ?? current.label}</span>
                {brand?.tag && (
                    <span className={cn('shrink-0 rounded px-1 text-[0.625rem] leading-4 font-semibold', compact ? 'bg-zinc-100 text-zinc-500' : 'bg-rail-active text-rail-muted')}>{brand.tag}</span>
                )}
                <ChevronsUpDown className={cn('ml-auto size-3.5 shrink-0', compact ? 'text-zinc-400' : 'text-rail-muted')} />
            </summary>
            <div className="absolute left-0 z-50 mt-1 w-72 group-open:animate-panel-drop rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
                {panels
                    .filter((entry) => !entry.replaces)
                    .map((entry) => (
                        <div key={entry.id}>
                            <PanelRow entry={entry} replacements={panels.filter((replacement) => replacement.replaces === entry.id)} />
                            {entry.divider_after && <div className="my-1 border-t border-zinc-100" />}
                        </div>
                    ))}
            </div>
        </details>
    )
}
