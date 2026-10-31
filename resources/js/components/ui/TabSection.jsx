import { useEffect, useState } from 'react'

import { readStorage, writeStorage } from '../../lib/browser'
import { cn } from '../../lib/cn'

function store(storageKey, value) {
    if (storageKey) {
        writeStorage(storageKey, value)
    }
}

function Tab({ tab, active, onSelect }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onSelect}
            className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-2 px-1 py-1.5 text-xs font-semibold whitespace-nowrap',
                active ? 'border-zinc-800 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800',
            )}
        >
            {tab.label}
            {tab.count !== undefined && (
                <span className={cn('rounded-full px-1.5 text-[0.625rem] leading-4 tabular-nums', active ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-500')}>{tab.count}</span>
            )}
        </button>
    )
}

export function TabSection({ tabs, defaultTab, storageKey, value, onChange, flush = false, className, bodyClassName }) {
    const [stored, setStored] = useState(defaultTab ?? tabs[0]?.key)

    useEffect(() => {
        const remembered = storageKey ? readStorage(storageKey) : null

        if (remembered !== null) {
            setStored(remembered)
        }
    }, [storageKey])
    const selected = value ?? stored
    const active = tabs.find((tab) => tab.key === selected) ?? tabs[0]

    function select(key) {
        setStored(key)
        store(storageKey, key)
        onChange?.(key)
    }

    return (
        <section className={cn('min-w-0 rounded border border-zinc-200 bg-white', className)}>
            <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-t border-b border-zinc-200 bg-zinc-50 px-2.5">
                <div role="tablist" className="flex max-w-full items-center gap-3 overflow-x-auto overflow-y-hidden">
                    {tabs.map((tab) => (
                        <Tab key={tab.key} tab={tab} active={tab.key === active.key} onSelect={() => select(tab.key)} />
                    ))}
                </div>
                {active.hint && <span className="text-[0.6875rem] text-zinc-500">{active.hint}</span>}
                {active.actions && <div className="ml-auto flex items-center gap-2 py-1">{active.actions}</div>}
            </header>
            <div role="tabpanel" className={cn(!flush && 'p-2.5', bodyClassName)}>
                {active.content}
            </div>
        </section>
    )
}
