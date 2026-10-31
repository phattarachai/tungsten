import { strings } from './strings'

function xsrfToken() {
    const cookie = document.cookie.split('; ').find((entry) => entry.startsWith('XSRF-TOKEN='))

    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : ''
}

function withQuery(url, query) {
    const target = new URL(url, window.location.origin)

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            target.searchParams.set(key, value)
        }
    })

    return target.toString()
}

/**
 * A JSON call to the app with Laravel's XSRF cookie, for what isn't an Inertia visit (a dialog's lookup, a quick
 * save). Resolves `{ ok, status, body, errors, message }`: `errors` holds a 422's first message per field, so a form
 * can show them beside its inputs; `message` is the server's, or a generic one when it failed without one. A GET's
 * `data` goes in the query string. Never rejects for an HTTP error, only for a network one.
 */
export async function sendJson(url, method = 'GET', data = null) {
    const get = method.toUpperCase() === 'GET'
    const response = await fetch(get && data ? withQuery(url, data) : url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
            ...(data && !get ? { 'Content-Type': 'application/json' } : {}),
        },
        body: data && !get ? JSON.stringify(data) : undefined,
    })
    const body = await response.json().catch(() => ({}))
    const errors = response.status === 422 ? Object.fromEntries(Object.entries(body.errors ?? {}).map(([field, messages]) => [field, [messages].flat()[0]])) : {}

    return { ok: response.ok, status: response.status, body, errors, message: body.message ?? (response.ok ? null : strings.requestFailed) }
}

async function orThrow(call) {
    const result = await call

    if (!result.ok) {
        throw Object.assign(new Error(result.message), { status: result.status, errors: result.errors, body: result.body })
    }

    return result.body
}

/** `sendJson` GET that resolves the body and rejects with the server's message (`error.errors` for a 422). */
export function getJson(url, query = {}) {
    return orThrow(sendJson(url, 'GET', query))
}

/** `sendJson` POST (or `method`) that resolves the body and rejects with the server's message. */
export function postJson(url, data = {}, method = 'POST') {
    return orThrow(sendJson(url, method, data))
}
