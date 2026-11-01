import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from './IconButton'
import { cn } from '../../lib/cn'
import { strings } from '../../lib/strings'

/** The clipboard API, or a hidden textarea + execCommand where it's missing (a page served over plain http). */
async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text)
    }

    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    document.execCommand?.('copy')
    area.remove()
}

/**
 * Copies `value` (a short link, a code) to the clipboard; the icon turns to a tick ("คัดลอกแล้ว") for a moment.
 */
export function CopyButton({ value, label = strings.copy, copiedLabel = strings.copied, className }) {
    const [copied, setCopied] = useState(false)
    const timer = useRef(null)

    useEffect(() => () => clearTimeout(timer.current), [])

    async function copy() {
        await writeClipboard(String(value ?? ''))
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 1500)
    }

    return <IconButton icon={copied ? Check : Copy} label={copied ? copiedLabel : label} onClick={copy} className={cn(copied && 'text-tone-done-ink hover:text-tone-done-ink', className)} />
}
