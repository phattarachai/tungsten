// Kit components checked in a DOM (jsdom) under Node: `npm run unit` runs it after unit-check.js, with
// dom-setup.js loaded first (`node --import`) so React sees a browser.
import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { SearchInput } from '@tungsten'

function mount(element) {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)

    act(() => root.render(element))

    return { input: host.querySelector('input'), render: (next) => act(() => root.render(next)), unmount: () => act(() => root.unmount()) }
}

function type(input, text) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set

    act(() => {
        setter.call(input, text)
        input.dispatchEvent(new window.Event('input', { bubbles: true }))
    })
}

const checks = {
    'SearchInput follows `value` when it changes from outside (a clear-all), while the box is not focused': () => {
        const box = mount(<SearchInput value="web" onSearch={() => {}} />)
        assert.equal(box.input.value, 'web')

        box.render(<SearchInput value="" onSearch={() => {}} />)
        assert.equal(box.input.value, '')
        box.unmount()
    },

    'SearchInput keeps what the user is typing when `value` changes under a focused box': () => {
        const box = mount(<SearchInput value="" onSearch={() => {}} />)

        act(() => box.input.focus())
        type(box.input, 'webs')
        box.render(<SearchInput value="web" onSearch={() => {}} />)
        assert.equal(box.input.value, 'webs')
        box.unmount()
    },

    'an outside change cancels a pending debounced search': async () => {
        const searched = []
        const box = mount(<SearchInput value="" debounce={20} onSearch={(term) => searched.push(term)} />)

        type(box.input, 'old')
        act(() => box.input.blur())
        box.render(<SearchInput value="" debounce={20} onSearch={(term) => searched.push(term)} />)
        box.render(<SearchInput value="new" debounce={20} onSearch={(term) => searched.push(term)} />)
        await new Promise((resolve) => setTimeout(resolve, 60))

        assert.deepEqual(searched, [])
        assert.equal(box.input.value, 'new')
        box.unmount()
    },
}

for (const [name, check] of Object.entries(checks)) {
    await check()
    console.log(`ok  ${name}`)
}
