import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'

const SIZES = {
    sm: { input: 'h-6 w-48 max-w-full rounded pr-2 pl-6 text-[0.6875rem]', icon: 'left-1.5 size-3' },
    md: { input: 'w-56 rounded-md py-1.5 pr-3 pl-8 text-[0.8125rem]', icon: 'left-2.5 size-3.5' },
}

/**
 * Controlled with `value` + `onChange`; with only `onSearch` it keeps its own text (starting from `value`, e.g. the
 * server's current `?search=`) and calls `onSearch(trimmed)` `debounce` ms after the last keystroke.
 */
export function SearchInput({ value, onChange, onSearch, debounce = 300, placeholder = strings.search, size = 'sm', className, inputClassName }) {
    const timer = useRef(null)
    const [local, setLocal] = useState(value ?? '')
    const controlled = onChange !== undefined

    useEffect(() => () => clearTimeout(timer.current), [])

    function change(next) {
        if (controlled) {
            onChange(next)
        } else {
            setLocal(next)
        }

        if (!onSearch) {
            return
        }

        clearTimeout(timer.current)
        timer.current = setTimeout(() => onSearch(next.trim()), debounce)
    }

    return (
        <label className={cn('relative inline-flex items-center', className)}>
            <Search className={cn('pointer-events-none absolute text-zinc-400', SIZES[size].icon)} />
            <input
                type="search"
                value={controlled ? value : local}
                onChange={(event) => change(event.target.value)}
                placeholder={placeholder}
                className={cn(
                    'border border-zinc-300 bg-white text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none',
                    SIZES[size].input,
                    inputClassName,
                )}
            />
        </label>
    )
}
