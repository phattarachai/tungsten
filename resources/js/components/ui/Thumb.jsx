import { ImageOff } from 'lucide-react'
import { useState } from 'react'

import { cn } from '../../lib/cn'

/**
 * A fixed-size rounded image (2rem, 40px in the shell, by default; resize with `className`), with a grey placeholder
 * when there is no `src` or it fails to load.
 */
export function Thumb({ src, alt = '', className }) {
    const [failed, setFailed] = useState(null)
    const frame = cn('size-8 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-100', className)

    if (!src || failed === src) {
        return (
            <span className={cn('inline-flex items-center justify-center text-zinc-300', frame)} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
                <ImageOff className="size-1/2 max-h-4 max-w-4" />
            </span>
        )
    }

    return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} className={cn('object-cover', frame)} />
}
