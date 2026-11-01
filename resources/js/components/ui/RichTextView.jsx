import { cn } from '../../lib/cn'
import { RICH_TEXT_CLASS } from '../../lib/richText'

/**
 * Stored rich text (HTML) shown read-only, styled like the `RichText` editor, without loading it. The HTML must come
 * from the app (trusted, e.g. sanitised on save), never straight from a visitor.
 */
export function RichTextView({ html, className }) {
    if (!html) {
        return null
    }

    return <div className={cn(RICH_TEXT_CLASS, className)} dangerouslySetInnerHTML={{ __html: html }} />
}
