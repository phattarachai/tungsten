/**
 * The status tones' ink (text) and dot (background) classes, written out so Tailwind sees them. Keys are the tone
 * names (README → "Status tones"); the colours are the --color-tone-* tokens.
 */
export const TONE_INK = {
    draft: 'text-tone-draft-ink',
    waiting: 'text-tone-waiting-ink',
    todo: 'text-tone-todo-ink',
    active: 'text-tone-active-ink',
    done: 'text-tone-done-ink',
    canceled: 'text-tone-canceled-ink',
    failed: 'text-tone-failed-ink',
}

export const TONE_DOT = {
    draft: 'bg-tone-draft-ink',
    waiting: 'bg-tone-waiting-ink',
    todo: 'bg-tone-todo-ink',
    active: 'bg-tone-active-ink',
    done: 'bg-tone-done-ink',
    canceled: 'bg-tone-canceled-ink',
    failed: 'bg-tone-failed-ink',
}
