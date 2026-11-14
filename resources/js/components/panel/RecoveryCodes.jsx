import { CopyButton } from '../ui/CopyButton'

/** Recovery codes in a two-column grid, with a button that copies them all, one per line. */
export function RecoveryCodes({ codes, copyLabel }) {
    return (
        <div className="space-y-2">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-zinc-100 px-4 py-3 font-mono text-[0.8125rem] text-zinc-800">
                {codes.map((code) => (
                    <li key={code}>{code}</li>
                ))}
            </ul>
            <div className="flex items-center gap-1 text-zinc-500">
                <CopyButton value={codes.join('\n')} label={copyLabel} />
                <span>{copyLabel}</span>
            </div>
        </div>
    )
}
