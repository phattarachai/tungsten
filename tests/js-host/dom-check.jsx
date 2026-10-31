// Kit components checked in a DOM (jsdom) under Node: `npm run unit` runs it after unit-check.js, with
// dom-setup.js loaded first (`node --import`) so React sees a browser.
import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

import { Combobox, SearchInput, Thumb, Zoomable } from '@tungsten'
import { FlashToastFor } from '@tungsten/components/panel/FlashToast'

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

const viewer = () => document.querySelector('[role="dialog"]')
const key = (name, extra = {}) => act(() => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: name, bubbles: true, ...extra })))

Object.assign(checks, {
    'Zoomable opens its group full screen: focus on ×, body locked, arrows step, Tab stays inside, Escape restores': () => {
        const images = [
            { src: '/a-thumb.jpg', full: '/a.jpg', alt: 'สลิปโอน' },
            { src: '/b.jpg', alt: 'คูปอง' },
        ]
        const box = mount(
            <Zoomable images={images} index={0}>
                <img src="/a-thumb.jpg" alt="" />
            </Zoomable>,
        )
        const trigger = document.querySelector('button[aria-label="ดูรูป สลิปโอน"]')

        act(() => trigger.focus())
        act(() => trigger.click())

        assert.ok(viewer(), 'the viewer opens')
        assert.equal(viewer().querySelector('img').getAttribute('src'), '/a.jpg', 'shows the full image')
        assert.match(viewer().textContent, /สลิปโอน\s*1 \/ 2/)
        assert.equal(document.body.style.overflow, 'hidden')
        assert.equal(document.activeElement.getAttribute('aria-label'), 'ปิด')

        key('ArrowRight')
        assert.match(viewer().textContent, /คูปอง\s*2 \/ 2/)

        const buttons = [...viewer().querySelectorAll('button')]
        act(() => buttons.at(-1).focus())
        key('Tab')
        assert.equal(document.activeElement, buttons[0], 'Tab wraps to the first control')

        key('Escape')
        assert.equal(viewer(), null)
        assert.equal(document.body.style.overflow, '')
        assert.equal(document.activeElement, trigger, 'focus goes back to the thumbnail')
        box.unmount()
    },

    'a click outside the image closes the viewer, a click on it does not': () => {
        const box = mount(<Thumb src="/p.jpg" alt="สินค้า" zoom />)

        act(() => document.querySelector('button[aria-label="ดูรูป สินค้า"]').click())
        act(() => viewer().querySelector('img').click())
        assert.ok(viewer())

        act(() => viewer().click())
        assert.equal(viewer(), null)
        box.unmount()
    },

    'a Thumb without an image is not zoomable': () => {
        const box = mount(<Thumb src={null} alt="ไม่มีรูป" zoom />)

        assert.equal(document.querySelector('button[aria-label^="ดูรูป"]'), null)
        box.unmount()
    },
})

Object.assign(checks, {
    'Combobox draws an option avatar in the chosen value and the list, the initial when the URL is null': () => {
        const options = [
            { value: 1, label: 'เกศินี วงศ์ใหญ่', avatar: '/avatars/1.jpg' },
            { value: 2, label: 'สมชาย มั่นคง', avatar: null },
            { value: 3, label: 'ไม่มีรูป' },
        ]
        const box = mount(<Combobox options={options} value={1} onChange={() => {}} aria-label="ลูกค้า" />)
        const trigger = document.querySelector('button[aria-label="ลูกค้า"]')

        assert.equal(trigger.querySelector('img')?.getAttribute('src'), '/avatars/1.jpg')

        act(() => trigger.click())
        const rows = [...document.querySelectorAll('[role="option"]')]
        assert.equal(rows[0].querySelector('img')?.getAttribute('src'), '/avatars/1.jpg')
        assert.equal(rows[1].querySelector('img'), null)
        assert.match(rows[1].textContent, /^สสมชาย/, 'initial before the label')
        assert.equal(rows[2].querySelector('.rounded-full'), null, 'no avatar key, no avatar')
        box.unmount()
    },
})

const zIndex = (element) => Number(/(?:^|\s)z-\[?(\d+)\]?(?:\s|$)/.exec(element.className)?.[1] ?? 0)

Object.assign(checks, {
    'the flash toast sits above every overlay: portaled to body, over the dialog (z-50) and the lightbox (z-[60])': () => {
        const box = mount(<FlashToastFor flash={{ message: { message: 'บันทึกไม่สำเร็จ', tone: 'error' }, id: 'a' }} />)
        const toast = document.querySelector('[role="status"]')

        assert.equal(toast.parentElement, document.body)
        assert.ok(zIndex(toast) > 60, `toast z-index ${zIndex(toast)}`)
        box.unmount()
    },

    'the same flash message on the next response is a new toast; the same response re-rendered is not': () => {
        const flash = (id) => ({ message: { message: 'แต้มคงเหลือไม่เพียงพอ', tone: 'error' }, id })
        const box = mount(<FlashToastFor flash={flash('1')} />)
        const first = document.querySelector('[role="status"]')

        box.render(<FlashToastFor flash={flash('1')} />)
        assert.equal(document.querySelector('[role="status"]'), first, 'same id keeps the toast')

        box.render(<FlashToastFor flash={flash('2')} />)
        const second = document.querySelector('[role="status"]')
        assert.ok(second && second !== first, 'a new id starts a new toast')
        assert.equal(document.querySelectorAll('[role="status"]').length, 1)
        box.unmount()
    },
})

for (const [name, check] of Object.entries(checks)) {
    await check()
    console.log(`ok  ${name}`)
}
