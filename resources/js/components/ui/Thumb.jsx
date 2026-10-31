import { ImageOff } from 'lucide-react'
import { useState } from 'react'

import { Zoomable } from './Lightbox'
import { cn } from '../../lib/cn'

/**
 * A fixed-size rounded image (2rem, 40px in the shell, by default; resize with `className`), with a grey placeholder
 * when there is no `src` or it fails to load. `zoom` opens it full screen: `true` for this image (`full` being the
 * large file, if `src` is a thumbnail), or `{ images, index }` to step through its group.
 */
export function Thumb({ src, full, alt = '', zoom = false, className }) {
    const [failed, setFailed] = useState(null)
    const frame = cn('size-8 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-100', className)

    if (!src || failed === src) {
        return (
            <span className={cn('inline-flex items-center justify-center text-zinc-300', frame)} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
                <ImageOff className="size-1/2 max-h-4 max-w-4" />
            </span>
        )
    }

    const image = <img src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} className={cn('object-cover', frame)} />

    if (!zoom) {
        return image
    }

    return zoom === true ? <Zoomable src={src} full={full} alt={alt}>{image}</Zoomable> : <Zoomable images={zoom.images} index={zoom.index}>{image}</Zoomable>
}
