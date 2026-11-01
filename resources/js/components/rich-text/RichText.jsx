import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Redo2, Underline, Undo2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { RICH_TEXT_CLASS } from '../../lib/richText'
import { strings } from '../../lib/strings'

function ToolButton({ label, active = false, disabled = false, onClick, children }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={cn('inline-grid size-6 place-items-center rounded text-zinc-600 hover:bg-zinc-100 disabled:opacity-40', active && 'bg-zinc-200 text-zinc-900')}
        >
            {children}
        </button>
    )
}

/** A one-line URL input under the toolbar, for a link or an image. */
function UrlBar({ initial = '', label, applyLabel, onApply, onClose }) {
    const [url, setUrl] = useState(initial)

    function apply() {
        onApply(url.trim())
        onClose()
    }

    return (
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-2 py-1">
            <input
                autoFocus
                value={url}
                placeholder="https://"
                aria-label={label}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault()
                        apply()
                    }

                    if (event.key === 'Escape') {
                        onClose()
                    }
                }}
                className="h-6 min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 text-xs focus:border-brand focus:outline-none"
            />
            <button type="button" onClick={apply} className="text-xs font-medium text-brand">
                {applyLabel}
            </button>
            <button type="button" onClick={onClose} className="text-xs text-zinc-500">
                {strings.cancel}
            </button>
        </div>
    )
}

/** The editor's HTML, '' when it holds nothing but an empty paragraph. */
function htmlOf(editor) {
    return editor.isEmpty ? '' : editor.getHTML()
}

function useToolbarState(editor) {
    return useEditorState({
        editor,
        selector: ({ editor: current }) =>
            current
                ? {
                      h2: current.isActive('heading', { level: 2 }),
                      h3: current.isActive('heading', { level: 3 }),
                      bold: current.isActive('bold'),
                      italic: current.isActive('italic'),
                      underline: current.isActive('underline'),
                      bullet: current.isActive('bulletList'),
                      ordered: current.isActive('orderedList'),
                      link: current.isActive('link'),
                      canUndo: current.can().undo(),
                      canRedo: current.can().redo(),
                  }
                : null,
    })
}

/**
 * A rich-text field on Tiptap: headings, bold, italic, underline, lists, links and images (by URL, or uploaded with
 * `onUploadImage(file) → url`). `value` / `onChange` carry HTML; an empty editor reports ''. `onChange` fires only on
 * an edit, so loading stored HTML never rewrites it. Markup the editor doesn't model (a `div`, inline styles, a table)
 * is normalised once the text is edited; the HTML button shows and edits the source as it is. Re-key it to load
 * another record. Import from `@tungsten/rich-text` (it needs the Tiptap packages); show stored HTML read-only with
 * `RichTextView` from `@tungsten`.
 */
export function RichText({ id, value, onChange, placeholder, headings = true, onUploadImage, minHeight = '8rem', invalid = false, className }) {
    const [bar, setBar] = useState(null)
    const [source, setSource] = useState(false)
    const [uploading, setUploading] = useState(false)
    const picker = useRef(null)
    const latest = useRef(value ?? '')

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            // No trailing empty paragraph and no target/rel added to links: the stored HTML changes only where it's edited.
            StarterKit.configure({
                heading: { levels: [2, 3] },
                trailingNode: false,
                link: { openOnClick: false, autolink: true, HTMLAttributes: { target: null, rel: null } },
            }),
            Image,
            Placeholder.configure({ placeholder: placeholder ?? '' }),
        ],
        content: value ?? '',
        onUpdate: ({ editor: current }) => {
            latest.current = htmlOf(current)
            onChange(latest.current)
        },
        editorProps: {
            attributes: { ...(id ? { id } : {}), class: cn('px-3 py-2 focus:outline-none', RICH_TEXT_CLASS), style: `min-height:${minHeight}` },
        },
    })
    const state = useToolbarState(editor)

    useEffect(() => {
        if (editor && (value ?? '') !== latest.current) {
            latest.current = value ?? ''
            editor.commands.setContent(value ?? '', { emitUpdate: false })
        }
    }, [editor, value])

    const toggle = (name) => setBar((open) => (open === name ? null : name))
    const run = (command) => editor && command(editor.chain().focus()).run()

    async function upload(event) {
        const file = event.target.files?.[0]
        event.target.value = ''

        if (!file || !editor) {
            return
        }

        setUploading(true)

        try {
            const src = await onUploadImage(file)

            if (src) {
                editor.chain().focus().setImage({ src }).run()
            }
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className={cn('overflow-hidden rounded-md border bg-white transition focus-within:border-brand', invalid ? 'border-red-400' : 'border-zinc-300', className)}>
            <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 px-1.5 py-1">
                {headings && (
                    <>
                        <ToolButton label={strings.richTextHeading2} active={state?.h2} disabled={source} onClick={() => run((chain) => chain.toggleHeading({ level: 2 }))}>
                            <Heading2 className="size-3.5" />
                        </ToolButton>
                        <ToolButton label={strings.richTextHeading3} active={state?.h3} disabled={source} onClick={() => run((chain) => chain.toggleHeading({ level: 3 }))}>
                            <Heading3 className="size-3.5" />
                        </ToolButton>
                        <span className="mx-1 h-4 w-px bg-zinc-200" />
                    </>
                )}
                <ToolButton label={strings.richTextBold} active={state?.bold} disabled={source} onClick={() => run((chain) => chain.toggleBold())}>
                    <Bold className="size-3.5" />
                </ToolButton>
                <ToolButton label={strings.richTextItalic} active={state?.italic} disabled={source} onClick={() => run((chain) => chain.toggleItalic())}>
                    <Italic className="size-3.5" />
                </ToolButton>
                <ToolButton label={strings.richTextUnderline} active={state?.underline} disabled={source} onClick={() => run((chain) => chain.toggleUnderline())}>
                    <Underline className="size-3.5" />
                </ToolButton>
                <span className="mx-1 h-4 w-px bg-zinc-200" />
                <ToolButton label={strings.richTextBulletList} active={state?.bullet} disabled={source} onClick={() => run((chain) => chain.toggleBulletList())}>
                    <List className="size-3.5" />
                </ToolButton>
                <ToolButton label={strings.richTextOrderedList} active={state?.ordered} disabled={source} onClick={() => run((chain) => chain.toggleOrderedList())}>
                    <ListOrdered className="size-3.5" />
                </ToolButton>
                <span className="mx-1 h-4 w-px bg-zinc-200" />
                <ToolButton label={strings.richTextLink} active={state?.link || bar === 'link'} disabled={source} onClick={() => toggle('link')}>
                    <Link2 className="size-3.5" />
                </ToolButton>
                <ToolButton label={strings.richTextImage} active={bar === 'image'} disabled={source} onClick={() => toggle('image')}>
                    <ImagePlus className="size-3.5" />
                </ToolButton>
                {onUploadImage && (
                    <ToolButton label={strings.richTextUpload} disabled={source || uploading} onClick={() => picker.current?.click()}>
                        <Upload className="size-3.5" />
                    </ToolButton>
                )}
                <span className="ml-auto" />
                <ToolButton label={strings.richTextUndo} disabled={source || !state?.canUndo} onClick={() => run((chain) => chain.undo())}>
                    <Undo2 className="size-3.5" />
                </ToolButton>
                <ToolButton label={strings.richTextRedo} disabled={source || !state?.canRedo} onClick={() => run((chain) => chain.redo())}>
                    <Redo2 className="size-3.5" />
                </ToolButton>
                <ToolButton label={strings.richTextSource} active={source} onClick={() => setSource(!source)}>
                    <Code className="size-3.5" />
                </ToolButton>
            </div>
            {bar === 'link' && editor && (
                <UrlBar
                    initial={editor.getAttributes('link').href ?? ''}
                    label={strings.richTextLink}
                    applyLabel={strings.richTextApplyLink}
                    onApply={(url) => run((chain) => (url === '' ? chain.extendMarkRange('link').unsetLink() : chain.extendMarkRange('link').setLink({ href: url })))}
                    onClose={() => setBar(null)}
                />
            )}
            {bar === 'image' && editor && (
                <UrlBar label={strings.richTextImage} applyLabel={strings.richTextApplyImage} onApply={(url) => url !== '' && run((chain) => chain.setImage({ src: url }))} onClose={() => setBar(null)} />
            )}
            {onUploadImage && <input ref={picker} type="file" accept="image/*" className="hidden" onChange={upload} aria-label={strings.richTextUpload} />}
            {source ? (
                <textarea
                    value={value ?? ''}
                    onChange={(event) => onChange(event.target.value)}
                    spellCheck={false}
                    aria-label={strings.richTextSource}
                    className="block w-full resize-y px-3 py-2 font-mono text-[0.75rem] text-zinc-800 focus:outline-none"
                    style={{ minHeight }}
                />
            ) : (
                <EditorContent
                    editor={editor}
                    className="[&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-brand [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-zinc-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
                />
            )}
        </div>
    )
}
