// Pure kit helpers checked under Node: `npm run unit` (CI runs it next to the build and the SSR render).
import assert from 'node:assert/strict'

import { applyQuery } from '@tungsten'
import { bodyText, claimIds, countedTitle, dismissToast, expireToasts, extendToasts, intake, NO_TOASTS, pollDelay, pushToasts, removeLeft, syncToasts, verdict, WINDOW } from '@tungsten/lib/notices'

const notice = (id, minute = 0, more = {}) => ({ id, title: id, body: null, url: null, read: false, at: `2026-11-25T10:${String(minute).padStart(2, '0')}:00+07:00`, ...more })
const ids = (stack) => stack.shown.map((toast) => toast.item.id)

const checks = {
    'clears an array filter Inertia wrote in indexed form': () =>
        assert.equal(applyQuery('/admin/orders?type[0]=a&type[1]=b&search=x', { type: null }), '/admin/orders?search=x'),

    'replaces indexed and bracket values with the new array': () =>
        assert.equal(decodeURIComponent(applyQuery('/admin/orders?type[0]=a&type[]=b', { type: ['c'] })), '/admin/orders?type[]=c'),

    'reads URL-encoded brackets as the same key': () =>
        assert.equal(applyQuery('/admin/orders?type%5B0%5D=a', { type: [] }), '/admin/orders'),

    'leaves other keys that share a prefix alone': () =>
        assert.equal(applyQuery('/admin/orders?types=a&type_id=2', { type: null }), '/admin/orders?types=a&type_id=2'),

    'goes back to page 1 unless keepPage': () => {
        assert.equal(applyQuery('/admin/orders?page=3', { status: 'paid' }), '/admin/orders?status=paid')
        assert.equal(applyQuery('/admin/orders?page=3', { page: 4 }, { keepPage: true }), '/admin/orders?page=4')
    },

    'bell: nothing that was there at load is new, what comes after is new once': () => {
        const first = intake(null, [notice('a', 1)])
        assert.deepEqual(first.fresh, [])

        const second = intake(first.tracker, [notice('b', 2), notice('a', 1)])
        assert.deepEqual(second.fresh.map((item) => item.id), ['b'])
        assert.deepEqual(intake(second.tracker, [notice('b', 2), notice('a', 1)]).fresh, [])
        assert.deepEqual(intake(second.tracker, [notice('b', 2, { title: 'edited' }), notice('a', 1, { body: 'edited' })]).fresh, [], 'an edit is not new')
    },

    'bell: an empty first load still makes the next item new, a read one never is': () => {
        const { tracker } = intake(null, [])
        assert.deepEqual(intake(tracker, [notice('b', 2, { read: true }), notice('a', 1)]).fresh.map((item) => item.id), ['a'])
    },

    'bell: an old item sliding into the window after a deletion is not new': () => {
        const full = Array.from({ length: WINDOW }, (_, index) => notice(`n${index}`, 40 - index))
        const { tracker } = intake(null, full)
        const oldest = full.at(-1)

        assert.deepEqual(intake(tracker, [...full.slice(1), notice('older', 1)]).fresh, [])
        assert.deepEqual(intake(tracker, [...full.slice(1), { ...notice('same second'), at: oldest.at }]).fresh, [])
        assert.equal(intake(tracker, [notice('new', 50), ...full.slice(1)]).fresh.length, 1)
    },

    'toasts: the newest three show, the rest are counted, later ones push the older off': () => {
        const five = ['e', 'd', 'c', 'b', 'a'].map((id) => notice(id))
        const stack = pushToasts(NO_TOASTS, five, 1000)
        assert.deepEqual([ids(stack), stack.more], [['e', 'd', 'c'], 2])

        const next = pushToasts(stack, [notice('f')], 2000)
        assert.deepEqual([ids(next), next.more], [['f', 'e', 'd'], 3])
        assert.equal(pushToasts(NO_TOASTS, Array.from({ length: 20 }, (_, index) => notice(`n${index}`)), 0, 25).more, 22)
        assert.equal(pushToasts(stack, [], 0), stack)
    },

    'toasts: leave when dismissed, on time or once read elsewhere, and the count goes with the last': () => {
        const stack = pushToasts(NO_TOASTS, [notice('b'), notice('a')], 0)

        assert.deepEqual(ids(removeLeft(dismissToast(stack, 'b'))), ['a'])
        assert.deepEqual(ids(removeLeft(expireToasts(stack, 7999))), ['b', 'a'])
        assert.deepEqual(ids(removeLeft(expireToasts(extendToasts(stack, 5000), 8000))), ['b', 'a'])
        assert.equal(removeLeft(expireToasts({ ...stack, more: 4 }, 8000)), NO_TOASTS)

        const synced = syncToasts(stack, [notice('b', 0, { title: 'edited' }), notice('a', 0, { read: true })])
        assert.equal(synced.shown[0].item.title, 'edited')
        assert.deepEqual(ids(removeLeft(synced)), ['b'])
    },

    'poll: its own pace, backs off on failures, hidden only with desktop notices and then once a minute': () => {
        assert.equal(pollDelay({ poll: 10 }), 10)
        assert.deepEqual([1, 2, 3, 9].map((failures) => pollDelay({ poll: 10, failures })), [20, 40, 80, 300])
        assert.equal(pollDelay({ poll: 600, failures: 3 }), 600)
        assert.equal(pollDelay({ poll: 10, hidden: true }), null)
        assert.equal(pollDelay({ poll: 10, hidden: true, background: true }), 60)
        assert.equal(pollDelay({ poll: 10, failures: 4, hidden: true, background: true }), 160)
    },

    'poll: what an answer means': () => {
        const body = { unread: 0, items: [] }

        assert.equal(verdict({ ok: true, status: 200, body }), 'ok')
        assert.deepEqual([401, 403, 419].map((status) => verdict({ ok: false, status, body: {} })), ['signedOut', 'signedOut', 'signedOut'])
        assert.equal(verdict({ ok: true, status: 200, redirected: true, body: {} }), 'signedOut', 'ended on the sign-in page')
        assert.equal(verdict({ ok: true, status: 200, redirected: true, body }), 'ok', 'a redirect to the bell itself')
        assert.deepEqual([0, 404, 500, 503].map((status) => verdict({ ok: false, status, body: {} })), ['failed', 'failed', 'failed', 'failed'])
    },

    'title: the count goes in front, changes and leaves; a page title that looks like one is kept': () => {
        const two = countedTitle('คำสั่งซื้อ', 2)
        assert.equal(two.full, '(2) คำสั่งซื้อ')
        assert.equal(countedTitle(two.full, 3, two).full, '(3) คำสั่งซื้อ')
        assert.equal(countedTitle(two.full, 0, two).full, 'คำสั่งซื้อ')
        assert.equal(countedTitle('ลูกค้า', 2, two).full, '(2) ลูกค้า', 'a new page title')
        assert.equal(countedTitle('(5) ดาว', 0, two).full, '(5) ดาว')
        assert.equal(countedTitle('x', 120).full, '(99+) x')
    },

    'claims: one tab wins an id, for a day': () => {
        const first = claimIds({}, ['a', 'b'], 1000)
        assert.deepEqual(first.won, ['a', 'b'])

        const second = claimIds(first.claims, ['b', 'c'], 2000)
        assert.deepEqual(second.won, ['c'])
        assert.deepEqual(claimIds(second.claims, ['a'], 1000 + 25 * 3600 * 1000).won, ['a'])
        assert.equal(Object.keys(claimIds({}, Array.from({ length: 300 }, (_, index) => `n${index}`), 1).claims).length, 200)
    },

    'a notice body keeps its line breaks, in one form': () => assert.equal(bodyText('a\r\nb\rc\n'), 'a\nb\nc'),
}

for (const [name, check] of Object.entries(checks)) {
    check()
    console.log(`ok  ${name}`)
}
