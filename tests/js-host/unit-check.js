// Pure kit helpers checked under Node: `npm run unit` (CI runs it next to the build and the SSR render).
import assert from 'node:assert/strict'

import { applyQuery } from '@tungsten'

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
}

for (const [name, check] of Object.entries(checks)) {
    check()
    console.log(`ok  ${name}`)
}
