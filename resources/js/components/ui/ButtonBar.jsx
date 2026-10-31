import { cn } from '../../lib/cn'

/**
 * Joins a record's related actions (buttons, an ActionMenu) into one bordered bar, the same 1.5rem high as a
 * lone sm Button. For a few actions that belong together; see docs/theme.md.
 */
export function ButtonBar({ className, children }) {
    return (
        <div
            role="group"
            className={cn(
                'inline-flex h-6 shrink-0 items-stretch overflow-hidden rounded-md border border-zinc-300 bg-white *:h-auto! *:rounded-none! *:border-y-0! *:border-r-0! *:first:border-l-0! [&>*+*]:border-l! [&>*+*]:border-l-zinc-200!',
                className,
            )}
        >
            {children}
        </div>
    )
}
