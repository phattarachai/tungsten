// Kit components checked in a DOM (jsdom) under Node: `npm run unit` runs it after unit-check.js, with
// dom-setup.js loaded first (`node --import`) so React sees a browser.
import assert from 'node:assert/strict'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Avatar, Checkbox, Combobox, DataTable, DatePicker, GlobalSearch, NotificationBell, PickerDialog, Sortable, DateRangePicker, Facts, Input, RadioGroup, Select, Textarea, getJson, postJson, SearchInput, sendJson, StatsStrip, Thumb, Zoomable } from '@tungsten'
import { FlashToastFor } from '@tungsten/components/panel/FlashToast'
import { RichText } from '@tungsten/rich-text'

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

Object.assign(checks, {
    'Avatar falls back to the initial when the photo fails to load, in Combobox options too': () => {
        const box = mount(<Avatar person={{ avatar: '/dead.jpg', name: 'เกศินี' }} />)

        act(() => document.querySelector('img[src="/dead.jpg"]').dispatchEvent(new window.Event('error')))
        assert.equal(document.querySelector('img[src="/dead.jpg"]'), null)
        assert.equal(document.body.textContent.trim(), 'ก')
        box.unmount()

        const combo = mount(<Combobox options={[{ value: 1, label: 'สมชาย', avatar: '/gone.jpg' }]} value={1} onChange={() => {}} aria-label="ลูกค้า" />)
        act(() => document.querySelector('img[src="/gone.jpg"]').dispatchEvent(new window.Event('error')))
        assert.match(document.querySelector('button[aria-label="ลูกค้า"]').textContent, /^สสมชาย/)
        combo.unmount()
    },

    'StatsStrip and Facts: falsy entries skipped, tone colours the value, an empty value is a dash': () => {
        const box = mount(
            <>
                <StatsStrip stats={[{ label: 'คำสั่งซื้อ', value: '12', hint: '30 วัน' }, null, { label: 'ค้างชำระ', value: '3', tone: 'todo' }]} />
                <Facts rows={[{ label: 'เบอร์โทร', value: '081' }, false, { label: 'อีเมล', value: null }]} />
            </>,
        )

        assert.equal(document.querySelectorAll('.\\@container .bg-sheet').length, 2)
        assert.ok([...document.querySelectorAll('.text-tone-todo-ink')].some((element) => element.textContent === '3'))
        assert.deepEqual([...document.querySelectorAll('dt')].map((element) => element.textContent), ['เบอร์โทร', 'อีเมล'])
        assert.equal(document.querySelectorAll('dd')[1].textContent, '—')
        box.unmount()
    },

    'sendJson sends the XSRF cookie and maps a 422 to field errors; getJson / postJson reject with the message': async () => {
        const calls = []
        document.cookie = 'XSRF-TOKEN=abc%3D'
        globalThis.fetch = async (url, init) => {
            calls.push({ url: String(url), init })

            return { ok: false, status: 422, json: async () => ({ message: 'ข้อมูลไม่ถูกต้อง', errors: { phone: ['เบอร์ไม่ถูกต้อง', 'x'] } }) }
        }

        const result = await sendJson('/admin/customers/1', 'PATCH', { phone: '1' })
        assert.equal(calls[0].init.headers['X-XSRF-TOKEN'], 'abc=')
        assert.equal(calls[0].init.body, '{"phone":"1"}')
        assert.deepEqual([result.ok, result.status, result.errors, result.message], [false, 422, { phone: 'เบอร์ไม่ถูกต้อง' }, 'ข้อมูลไม่ถูกต้อง'])

        await getJson('/admin/customers/search', { q: 'สม', empty: '' }).catch((error) => calls.push({ error }))
        assert.equal(calls[1].url, 'http://tungsten.local/admin/customers/search?q=%E0%B8%AA%E0%B8%A1')
        assert.equal(calls[1].init.body, undefined)
        assert.deepEqual([calls[2].error.message, calls[2].error.errors], ['ข้อมูลไม่ถูกต้อง', { phone: 'เบอร์ไม่ถูกต้อง' }])

        globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ id: 7 }) })
        assert.deepEqual(await postJson('/admin/customers', { name: 'ก' }), { id: 7 })
    },
})

Object.assign(checks, {
    'RadioGroup: one named group of native radios, picks by value, skips a disabled option, marks invalid': () => {
        const picked = []
        const options = [
            { value: 1, label: 'ใช้ข้อมูลของลูกค้า A', description: 'ชื่อ เบอร์ อีเมล' },
            { value: 2, label: 'ใช้ข้อมูลของลูกค้า B' },
            { value: 3, label: 'ปิดอยู่', disabled: true },
        ]
        const box = mount(<RadioGroup options={options} value="1" onChange={(value) => picked.push(value)} invalid aria-label="ข้อมูลที่เก็บไว้" />)
        const radios = [...document.querySelectorAll('input[type="radio"]')]

        assert.equal(new Set(radios.map((radio) => radio.name)).size, 1)
        assert.deepEqual(radios.map((radio) => radio.checked), [true, false, false], 'string "1" matches value 1')
        assert.equal(radios[2].disabled, true)
        assert.equal(document.querySelector('[role="radiogroup"]').getAttribute('aria-invalid'), 'true')

        act(() => radios[1].click())
        assert.deepEqual(picked, [2])
        assert.match(document.body.textContent, /ชื่อ เบอร์ อีเมล/)
        box.unmount()
    },

    'Checkbox: reports the new state, shows the mixed state and its error': () => {
        const changes = []
        const box = mount(<Checkbox checked={false} indeterminate onChange={(value) => changes.push(value)} label="ยืนยันการรวมลูกค้า" hint="ย้อนกลับไม่ได้" error="ต้องยืนยันก่อน" />)
        const input = document.querySelector('input[type="checkbox"]')

        assert.equal(input.indeterminate, true)
        assert.equal(input.getAttribute('aria-invalid'), 'true')
        assert.match(document.body.textContent, /ต้องยืนยันก่อน/)

        act(() => document.querySelector('label').click())
        assert.deepEqual(changes, [true])

        box.render(<Checkbox checked onChange={() => {}} label="ยืนยันการรวมลูกค้า" />)
        assert.equal(input.indeterminate, false)
        box.unmount()
    },
})

const classes = (element) => element.className.split(/\s+/)

Object.assign(checks, {
    "a caller's width wins over a field's own w-full; max-w / min-w keep it": () => {
        const box = mount(
            <>
                <Input data-check="input" className="w-64" />
                <Input data-check="capped" className="max-w-xs min-w-0" />
                <Textarea data-check="textarea" className="w-96" />
                <Select data-check="select" className="w-40">
                    <option>ก</option>
                </Select>
                <Select data-check="select-full">
                    <option>ก</option>
                </Select>
                <Combobox options={[]} value="" onChange={() => {}} aria-label="combo" className="w-56" />
                <DatePicker value="" onChange={() => {}} aria-label="date" className="w-48" />
                <DateRangePicker start="" end="" onChange={() => {}} className="w-64" />
            </>,
        )
        const get = (name) => document.querySelector(`[data-check="${name}"]`)

        assert.ok(classes(get('input')).includes('w-64') && !classes(get('input')).includes('w-full'))
        assert.ok(classes(get('capped')).includes('w-full'), 'max-w / min-w bound the default, not replace it')
        assert.ok(!classes(get('textarea')).includes('w-full'))
        assert.ok(!classes(get('select')).includes('w-full') && !classes(get('select').parentElement).includes('w-full'))
        assert.ok(classes(get('select-full')).includes('w-full'), 'the default stays without a caller width')
        assert.ok(!classes(document.querySelector('button[aria-label="combo"]').parentElement).includes('w-full'))

        const frames = [...document.querySelectorAll('span.rounded-md.border')].filter((frame) => classes(frame).includes('relative'))
        assert.ok(frames.length >= 2 && frames.every((frame) => !classes(frame).includes('w-full')), 'date pickers take the caller width')
        box.unmount()
    },
})

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
const pointer = (type, element, extra = {}) =>
    act(() => element.dispatchEvent(new window.MouseEvent(type, { bubbles: true, button: 0, clientX: 5, clientY: 5, ...extra })))

Object.assign(checks, {
    'Sortable: ↑/↓ on a handle moves the row, reports the order and keeps focus on it': async () => {
        const reports = []
        const items = [{ id: 'a', name: 'ร่ม' }, { id: 'b', name: 'แก้ว' }, { id: 'c', name: 'กระเป๋า' }]
        const box = mount(<Sortable items={items} renderItem={(item) => item.name} onReorder={(next) => reports.push(next.map((item) => item.id))} numbered />)
        const handle = document.querySelector('[data-sortable-handle="a"]')

        assert.equal(handle.getAttribute('aria-label'), 'ย้ายลำดับที่ 1')
        act(() => handle.focus())
        act(() => handle.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
        await frame()

        assert.deepEqual(reports, [['b', 'a', 'c']])
        assert.deepEqual([...document.querySelectorAll('[data-sortable-row]')].map((row) => row.getAttribute('data-sortable-row')), ['b', 'a', 'c'])
        assert.equal(document.activeElement.getAttribute('data-sortable-handle'), 'a', 'focus stays on the moved row')
        assert.equal(document.activeElement.getAttribute('aria-label'), 'ย้ายลำดับที่ 2')
        box.unmount()
    },

    'Sortable: a pointer drag moves rows live, fades the dragged one and reports once on drop': () => {
        const reports = []
        const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
        const box = mount(<Sortable items={items} renderItem={(item) => item.id} onReorder={(next) => reports.push(next.map((item) => item.id))} />)
        const handle = document.querySelector('[data-sortable-handle="a"]')
        const original = document.elementFromPoint

        document.elementFromPoint = () => document.querySelector('[data-sortable-row="c"]')
        pointer('pointerdown', handle)
        pointer('pointermove', handle)

        assert.deepEqual([...document.querySelectorAll('[data-sortable-row]')].map((row) => row.getAttribute('data-sortable-row')), ['b', 'c', 'a'])
        assert.equal(document.querySelector('[data-sortable-row="a"]').hasAttribute('data-dragging'), true)
        assert.deepEqual(reports, [], 'nothing reported mid-drag')

        pointer('pointerup', handle)
        assert.deepEqual(reports, [['b', 'c', 'a']])
        assert.equal(document.querySelector('[data-dragging]'), null)
        document.elementFromPoint = original
        box.unmount()
    },

    'a drag still drops when the moved row loses the pointer: move and release land elsewhere, not on the handle': () => {
        const reports = []
        const rows = [{ id: 1 }, { id: 2 }, { id: 3 }]
        const box = mount(<DataTable columns={[{ key: 'id', label: '#' }]} rows={rows} reorderable={{ onReorder: (next) => reports.push(next.map((row) => row.id)) }} />)
        const original = document.elementFromPoint
        const row = (id) => document.querySelector(`tbody tr[data-sortable-row="${id}"]`)

        document.elementFromPoint = () => row(3)
        pointer('pointerdown', document.querySelector('[data-sortable-handle="1"]'))
        pointer('pointermove', row(3))
        assert.deepEqual([...document.querySelectorAll('tbody tr')].map((tr) => tr.getAttribute('data-sortable-row')), ['2', '3', '1'], 'moved live: the dragged <tr> was re-inserted')

        pointer('pointerup', document.body)
        assert.deepEqual(reports, [[2, 3, 1]], 'the drop is reported')
        assert.equal(document.querySelector('[data-dragging]'), null, 'and the row no longer fades')
        assert.equal(document.body.style.userSelect, '')

        document.elementFromPoint = () => row(1)
        pointer('pointerdown', document.querySelector('[data-sortable-handle="2"]'))
        pointer('pointermove', row(1))
        pointer('pointercancel', document.body)
        assert.deepEqual([...document.querySelectorAll('tbody tr')].map((tr) => tr.getAttribute('data-sortable-row')), ['1', '2', '3'], 'a cancelled drag puts the rows back')
        assert.equal(reports.length, 1)

        document.elementFromPoint = original
        box.unmount()
    },

    'DataTable reorderable: a handle column, rows reorder by key, sorting off; a wrap column clamps with a tooltip': async () => {
        const reports = []
        const rows = [{ id: 1, title: 'ชุดของขวัญปีใหม่ 2569 พร้อมการ์ดอวยพรและกล่องพรีเมียม' }, { id: 2, title: 'ร่ม' }]
        const columns = [{ key: 'title', label: 'ชื่อ', sortable: true, wrap: 'w-96' }]
        const box = mount(<DataTable columns={columns} rows={rows} reorderable={{ onReorder: (next) => reports.push(next.map((row) => row.id)) }} />)

        assert.equal(document.querySelectorAll('[data-sortable-handle]').length, 2)
        assert.equal(document.querySelector('th button'), null, 'no sort button while reordering')

        const clamp = document.querySelector('td .line-clamp-2')
        assert.ok(clamp.classList.contains('w-96') && clamp.classList.contains('whitespace-normal'))
        assert.equal(clamp.getAttribute('title'), rows[0].title)

        const handle = document.querySelector('[data-sortable-handle="1"]')
        act(() => handle.focus())
        act(() => handle.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
        await frame()
        assert.deepEqual(reports, [[2, 1]])
        assert.deepEqual([...document.querySelectorAll('tbody tr')].map((row) => row.getAttribute('data-sortable-row')), ['2', '1'])
        box.unmount()
    },
})

Object.assign(checks, {
    'GlobalSearch: two letters, debounced, grouped results, ↑ / ↓ across groups, ⌘K focuses': async () => {
        const asked = []
        globalThis.fetch = async (url) => {
            asked.push(String(url))
            const q = new URL(String(url)).searchParams.get('q')

            return {
                ok: true,
                status: 200,
                json: async () => ({
                    groups: q === 'SO'
                        ? [
                              { label: 'ลูกค้า', results: [{ title: 'สมชาย SO', url: '/admin/customers/1', details: [{ label: 'เบอร์', value: '081' }], image: null }] },
                              { label: 'คำสั่งซื้อ', results: [{ title: 'SO-1001', url: '/admin/orders/1', details: [], image: null }] },
                          ]
                        : [],
                }),
            }
        }
        const box = mount(<GlobalSearch url="/admin/search" />)
        const input = document.querySelector('input[role="combobox"]')

        type(input, 'S')
        await new Promise((resolve) => setTimeout(resolve, 300))
        assert.equal(asked.length, 0, 'one letter asks nothing')

        type(input, 'SO')
        await act(() => new Promise((resolve) => setTimeout(resolve, 320)))
        assert.equal(asked.length, 1)
        assert.match(asked[0], /\/admin\/search\?q=SO$/)
        assert.deepEqual([...document.querySelectorAll('[role="listbox"] > div > div:first-child')].map((heading) => heading.textContent), ['ลูกค้า', 'คำสั่งซื้อ'])
        assert.match(document.querySelector('[role="option"]').textContent, /เบอร์ 081/)

        const selected = () => [...document.querySelectorAll('[role="option"]')].findIndex((option) => option.getAttribute('aria-selected') === 'true')
        assert.equal(selected(), 0)
        act(() => input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
        assert.equal(selected(), 1, 'moves into the next group')

        act(() => input.blur())
        act(() => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })))
        assert.equal(document.activeElement, input)
        box.unmount()
    },
})

Object.assign(checks, {
    'NotificationBell: unread badge from the first load, a list on open, mark one and all read': async () => {
        const calls = []
        let items = [
            { id: 'n1', title: 'ชำระเงินแล้ว', body: 'คำสั่งซื้อ SO-1', url: null, tone: 'done', icon: 'wallet', read: false, at: new Date().toISOString() },
            { id: 'n2', title: 'ส่งสินค้าแล้ว', body: null, url: null, tone: null, icon: null, read: false, at: new Date().toISOString() },
        ]
        const answer = () => ({ ok: true, status: 200, json: async () => ({ unread: items.filter((item) => !item.read).length, items }) })
        globalThis.fetch = async (url, init) => {
            calls.push(`${init.method} ${new URL(String(url), 'http://tungsten.local').pathname}`)

            if (String(url).endsWith('/n1/read')) {
                items = items.map((item) => (item.id === 'n1' ? { ...item, read: true } : item))
            } else if (String(url).endsWith('/notifications/read')) {
                items = items.map((item) => ({ ...item, read: true }))
            }

            return answer()
        }
        const box = mount(<NotificationBell url="/admin/notifications" poll={60} />)
        await act(() => new Promise((resolve) => setTimeout(resolve, 20)))

        const bell = document.querySelector('button[aria-expanded]')
        assert.equal(bell.textContent, '2')
        assert.equal(bell.getAttribute('aria-label'), 'การแจ้งเตือน ยังไม่อ่าน 2')

        await act(async () => bell.click())
        await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
        assert.match(document.body.textContent, /ชำระเงินแล้ว/)
        assert.match(document.body.textContent, /คำสั่งซื้อ SO-1/)

        await act(async () => [...document.querySelectorAll('button')].find((button) => button.textContent.includes('ชำระเงินแล้ว')).click())
        await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
        assert.ok(calls.includes('POST /admin/notifications/n1/read'))
        assert.equal(document.querySelector('button[aria-expanded]').textContent, '1')

        await act(async () => document.querySelector('button[aria-expanded]').click())
        await act(async () => [...document.querySelectorAll('button')].find((button) => button.textContent === 'อ่านทั้งหมดแล้ว').click())
        await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
        assert.ok(calls.includes('POST /admin/notifications/read'))
        assert.equal(document.querySelector('button[aria-expanded]').textContent, '', 'no badge once all are read')
        box.unmount()
    },
})

Object.assign(checks, {
    'DataTable subRows: each line is its own row under its parent, every column drawing its own value, and moves with it': async () => {
        const rows = [
            { id: 1, title: 'วิตามินซี', variants: [{ id: 'v1', name: '30 เม็ด', sku: 'VC-30', price: '฿190' }, { id: 'v2', name: '60 เม็ด', sku: 'VC-60', price: '฿350' }] },
            { id: 2, title: 'คอลลาเจน', variants: [] },
        ]
        const columns = [
            { key: 'title', label: 'สินค้า', sub: (line) => line.name },
            { key: 'sku', label: 'SKU', sub: (line) => line.sku },
            { key: 'price', label: 'ราคา', align: 'right', sub: (line) => line.price },
            { key: 'stock', label: 'คงเหลือ' },
        ]
        const reports = []
        const box = mount(<DataTable columns={columns} rows={rows} subRows={(row) => row.variants} />)
        const body = () => [...document.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent))

        assert.deepEqual(body(), [
            ['วิตามินซี', '', '', ''],
            ['30 เม็ด', 'VC-30', '฿190', ''],
            ['60 เม็ด', 'VC-60', '฿350', ''],
            ['คอลลาเจน', '', '', ''],
        ])
        assert.ok(document.querySelectorAll('tbody tr')[2].children[2].classList.contains('text-right'), 'a sub cell keeps its column alignment')

        box.render(<DataTable columns={columns} rows={rows} subRows={(row) => row.variants} reorderable={{ onReorder: (next) => reports.push(next.map((row) => row.id)) }} />)
        assert.deepEqual([...document.querySelectorAll('tbody tr')].map((tr) => tr.getAttribute('data-sortable-row')), ['1', '1', '1', '2'], 'sub-lines carry their row')

        const handle = document.querySelector('[data-sortable-handle="1"]')
        act(() => handle.focus())
        act(() => handle.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))
        await frame()
        assert.deepEqual(reports, [[2, 1]])
        assert.deepEqual([...document.querySelectorAll('tbody tr')].map((tr) => tr.getAttribute('data-sortable-row')), ['2', '1', '1', '1'])
        box.unmount()
    },
})

Object.assign(checks, {
    'RichText: loads stored HTML without reporting a change; the HTML view edits the source, and the editor follows': async () => {
        const changes = []
        const stored = '<h2>วิตามินซี</h2><p>ช่วย<strong>เสริม</strong>ภูมิคุ้มกัน</p><ul><li><p>วันละ 1 เม็ด</p></li></ul>'

        function Field() {
            const [value, setValue] = useState(stored)

            return (
                <RichText
                    value={value}
                    onChange={(html) => {
                        changes.push(html)
                        setValue(html)
                    }}
                />
            )
        }

        const box = mount(<Field />)
        await act(() => new Promise((resolve) => setTimeout(resolve, 50)))

        const editable = document.querySelector('[contenteditable="true"]')
        assert.ok(editable, 'the editor mounted')
        assert.match(editable.innerHTML, /<h2>วิตามินซี<\/h2>/)
        assert.match(editable.innerHTML, /<strong>เสริม<\/strong>/)
        assert.deepEqual(changes, [], 'loading reports nothing, so stored HTML is never rewritten by opening it')

        await act(async () => document.querySelector('button[aria-label="HTML"]').click())
        const source = document.querySelector('textarea[aria-label="HTML"]')
        assert.equal(source.value, stored, 'the HTML view shows the stored source as it is')

        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
        await act(async () => {
            setter.call(source, '<p>แก้จาก <a href="https://example.com">HTML</a></p>')
            source.dispatchEvent(new window.Event('input', { bubbles: true }))
        })
        assert.equal(changes.at(-1), '<p>แก้จาก <a href="https://example.com">HTML</a></p>')

        await act(async () => document.querySelector('button[aria-label="HTML"]').click())
        await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
        assert.match(document.querySelector('[contenteditable="true"]').innerHTML, /แก้จาก <a[^>]*href="https:\/\/example.com"/, 'back in the editor with the edited source')
        box.unmount()
    },
})

Object.assign(checks, {
    'PickerDialog: cards with ×qty, filtered as you type, a click picks and stays open, disabled cards do nothing': async () => {
        const picks = []
        const options = [
            { value: 1, title: 'วิตามินซี 1000', subtitle: '30 เม็ด', meta: '฿190' },
            { value: 2, title: 'คอลลาเจน', subtitle: 'ผง 200 ก.', meta: '฿590', disabled: true },
            { value: 3, title: 'น้ำมันปลา', meta: '฿350' },
        ]
        const box = mount(<PickerDialog title="เพิ่มสินค้า" options={options} counts={{ 1: 2 }} onPick={(option) => picks.push(option.value)} onClose={() => {}} />)
        const cards = () => [...document.querySelectorAll('[role="dialog"] .grid button')]

        assert.equal(cards().length, 3)
        assert.match(cards()[0].textContent, /×2/)
        await act(async () => cards()[0].click())
        await act(async () => cards()[1].click())
        assert.deepEqual(picks, [1], 'a disabled card is not picked')
        assert.ok(document.querySelector('[role="dialog"]'), 'the dialog stays open')

        type(document.querySelector('[role="dialog"] input'), 'น้ำมัน')
        assert.deepEqual(cards().map((card) => card.textContent.replace(/฿.*/, '')), ['น้ำมันปลา'])
        box.unmount()
    },

    'PickerDialog with a url: loads at once without a term, then searches as you type, debounced': async () => {
        const asked = []
        globalThis.fetch = async (url) => {
            const q = new URL(String(url)).searchParams.get('search')
            asked.push(q)

            return { ok: true, status: 200, json: async () => ({ data: [{ value: q || 'all', title: `ผล ${q || 'ทั้งหมด'}` }] }) }
        }
        const box = mount(<PickerDialog title="เลือกสินค้า" url="/admin/variants" onPick={() => {}} onClose={() => {}} />)
        await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
        assert.deepEqual(asked, [null], 'the first load sends no term')
        assert.match(document.querySelector('[role="dialog"] .grid').textContent, /ผล ทั้งหมด/)

        type(document.querySelector('[role="dialog"] input'), 'VC')
        await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
        assert.deepEqual(asked, [null, 'VC'])
        assert.match(document.querySelector('[role="dialog"] .grid').textContent, /ผล VC/)
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
