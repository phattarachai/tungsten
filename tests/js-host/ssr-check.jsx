// Renders kit and host pages to HTML under Node (no window / document), the way Inertia SSR does.
// `npm run ssr` builds this file with `vite build --ssr` and runs it; any DOM access during render throws.
import { renderToString } from 'react-dom/server'

import { createTungstenApp } from '@tungsten'

const pages = import.meta.glob('./resources/js/pages/panel/**/*.jsx')

const shared = {
    errors: {},
    auth: { user: { id: 1, name: 'Admin', email: 'admin@example.com' }, logoutUrl: { url: '/logout', method: 'post' } },
    panel: { id: 'admin', label: 'ร้านค้า', short: 'S', icon: 'store', color: '#0d9488', rail: null, brand: null, help: '/help', home: '/admin', environment: 'local' },
    panels: [{ id: 'admin', label: 'ร้านค้า', description: '', url: '/admin', short: 'S', icon: 'store', color: '#0d9488', current: true, divider_after: false, replaces: null }],
    nav: [{ group: 'การขาย', items: [{ label: 'คำสั่งซื้อ', icon: 'shopping-cart', url: { url: '/admin/orders', method: 'get' }, active: true, badge: null, external: false, legacy: false }] }],
    breadcrumbs: [{ label: 'การขาย' }, { label: 'คำสั่งซื้อ', url: '/admin/orders' }],
    flash: { message: 'บันทึกแล้ว', status: null },
    layout: null,
}

const table = { rows: [{ id: 1, created_at: '2026-10-31' }], pagination: { current_page: 1, last_page: 1, per_page: 25, total: 1, from: 1, to: 1 }, search: '', sort: null, filters: {} }

const cases = [
    ['tungsten::UiKit', { toastUrl: '/admin/ui-kit/toast' }, 'UI Kit'],
    ['tungsten::Home', { title: 'ร้านค้า', description: '' }, 'คำสั่งซื้อ'],
    ['tungsten::errors/Error', { status: 404, home: '/admin' }, '404'],
    ['panel/orders/Index', { title: 'คำสั่งซื้อ', table }, 'คำสั่งซื้อ'],
]

for (const [component, props, expected] of cases) {
    const page = { component, props: { ...shared, ...props }, url: '/admin/orders', version: null, clearHistory: false, encryptHistory: false }
    const { body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })

    if (!body.includes(expected)) {
        throw new Error(`${component}: rendered HTML is missing "${expected}"`)
    }

    console.log(`ssr ok  ${component}  (${body.length} bytes)`)
}
