export function DetailList({ items }) {
    return (
        <dl className="divide-y divide-zinc-100">
            {items.map((item) => (
                <div key={item.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 px-2.5 py-1.5">
                    <dt className="text-zinc-500">{item.label}</dt>
                    <dd className="break-words text-zinc-900">{item.value ?? <span className="text-zinc-300">—</span>}</dd>
                </div>
            ))}
        </dl>
    )
}
