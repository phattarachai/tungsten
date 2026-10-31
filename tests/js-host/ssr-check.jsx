// Renders kit and host pages to HTML under Node (no window / document), the way Inertia SSR does.
// `npm run ssr` builds this file with `vite build --ssr` and runs it; any DOM access during render throws.
import { renderToString } from 'react-dom/server'

import { createTungstenApp } from '@tungsten'

const pages = import.meta.glob('./resources/js/pages/panel/**/*.jsx')

const shared = {
    errors: {},
    auth: { user: { id: 1, name: 'Admin', email: 'admin@example.com' }, logoutUrl: { url: '/logout', method: 'post' } },
    panel: { id: 'admin', label: 'ร้านค้า', short: 'S', icon: 'store', color: '#0d9488', rail: null, brand: { label: 'ร้านค้า', icon: null, tag: 'v2', logo: '/images/brand-mark.svg' }, help: '/help', home: '/admin', environment: 'uat', env: { label: 'UAT', tone: 'todo' } },
    panels: [{ id: 'admin', label: 'ร้านค้า', description: '', url: '/admin', short: 'S', icon: 'store', color: '#0d9488', current: true, divider_after: false, replaces: null }],
    panel_links: [{ label: 'เว็บไซต์', url: 'https://shop.example.com/', icon: null, image: '/images/store.png' }, { label: 'Metabase', url: 'https://metabase.example.com', icon: 'gauge', image: null }],
    nav: [{ group: 'การขาย', items: [{ label: 'คำสั่งซื้อ', icon: 'shopping-cart', url: { url: '/admin/orders', method: 'get' }, active: true, badge: null, external: false, legacy: false }] }],
    breadcrumbs: [{ label: 'การขาย' }, { label: 'คำสั่งซื้อ', url: '/admin/orders' }],
    flash: { message: 'บันทึกแล้ว', status: null },
    layout: null,
}

const table = { rows: [{ id: 1, created_at: '2026-10-31' }], pagination: { current_page: 1, last_page: 1, per_page: 25, total: 1, from: 1, to: 1 }, search: '', sort: null, filters: {} }

const cases = [
    ['tungsten::UiKit', { toastUrl: '/admin/ui-kit/toast' }, 'Metabase'],
    ['tungsten::Home', { title: 'ร้านค้า', description: '' }, 'คำสั่งซื้อ'],
    ['tungsten::errors/Error', { status: 404, home: '/admin' }, '404'],
    ['panel/orders/Index', { title: 'คำสั่งซื้อ', table }, 'คำสั่งซื้อ'],
    ['tungsten::auth/Login', { labels: { title: 'เข้าสู่ระบบ', intro: '', email: 'อีเมล', password: 'รหัสผ่าน', remember: 'จดจำ', submit: 'เข้าสู่ระบบ', forgot: 'ลืมรหัสผ่าน?' }, action: '/admin/login', forgotPasswordUrl: '/forgot-password' }, 'ลืมรหัสผ่าน?'],
]

for (const [component, props, expected] of cases) {
    const page = { component, props: { ...shared, ...props }, url: '/admin/orders', version: null, clearHistory: false, encryptHistory: false }
    const { body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })

    if (!body.includes(expected)) {
        throw new Error(`${component}: rendered HTML is missing "${expected}"`)
    }

    console.log(`ssr ok  ${component}  (${body.length} bytes)`)
}

// The environment leads the tab title on the server too (the browser reads the root view's meta instead).
{
    const page = { component: 'tungsten::auth/Login', props: { ...shared, ...cases.find(([name]) => name === 'tungsten::auth/Login')[1] }, url: '/admin/login', version: null, clearHistory: false, encryptHistory: false }
    const { head, body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })

    if (!head.join('').includes('UAT · เข้าสู่ระบบ') || !body.includes('UAT')) {
        throw new Error(`env prefix missing: ${head.join('')}`)
    }

    console.log('ssr ok  env line and "UAT · " title prefix')
}
