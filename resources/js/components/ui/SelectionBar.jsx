import { strings } from '../../lib/strings'

export function SelectionBar({ count, unit = strings.items, onClear, children }) {
    return (
        <div className="flex flex-wrap items-center gap-2 bg-zinc-800 px-2.5 py-1.5 text-white">
            <span>
                {strings.selected(count, unit)}
            </span>
            {children}
            <button type="button" onClick={onClear} className="ml-auto text-zinc-300 hover:text-white hover:underline">
                {strings.clear}
            </button>
        </div>
    )
}
