// Renders kit and host pages to HTML under Node (no window / document), the way Inertia SSR does.
// `npm run ssr` builds this file with `vite build --ssr` and runs it; any DOM access during render throws.
import { renderToString } from 'react-dom/server'

import { createTungstenApp } from '@tungsten'
import { RichText } from '@tungsten/rich-text'

const pages = import.meta.glob('./resources/js/pages/panel/**/*.jsx')

const shared = {
    errors: {},
    auth: { user: { id: 1, name: 'Admin', email: 'admin@example.com' }, logoutUrl: { url: '/logout', method: 'post' } },
    panel: { id: 'admin', label: 'ร้านค้า', short: 'S', icon: 'store', color: '#0d9488', rail: null, brand: { label: 'ร้านค้า', icon: null, tag: 'v2', logo: '/images/brand-mark.svg' }, help: '/help', home: '/admin', environment: 'uat', env: { label: 'UAT', tone: 'todo' }, search: '/admin/search', notifications: { url: '/admin/notifications', poll: 30 } },
    panels: [{ id: 'admin', label: 'ร้านค้า', description: '', url: '/admin', short: 'S', icon: 'store', color: '#0d9488', current: true, divider_after: false, replaces: null }],
    panel_links: [{ label: 'เว็บไซต์', url: 'https://shop.example.com/', icon: null, image: '/images/store.png' }, { label: 'Metabase', url: 'https://metabase.example.com', icon: 'gauge', image: null }],
    nav: [{ group: 'การขาย', items: [{ label: 'คำสั่งซื้อ', icon: 'shopping-cart', url: { url: '/admin/orders', method: 'get' }, active: true, badge: null, external: false, legacy: false }] }],
    breadcrumbs: [{ label: 'การขาย' }, { label: 'คำสั่งซื้อ', url: '/admin/orders' }],
    flash: { message: 'บันทึกแล้ว', status: null },
    layout: null,
}

const table = { rows: [{ id: 1, created_at: '2026-10-31' }], pagination: { current_page: 1, last_page: 1, per_page: 25, total: 1, from: 1, to: 1 }, search: '', sort: null, filters: {} }

const authLabels = {
    email: 'อีเมล', forgotTitle: 'ลืมรหัสผ่าน', forgotIntro: 'กรอกอีเมล', sendLink: 'ส่งลิงก์ตั้งรหัสผ่านใหม่', backToLogin: 'กลับไปหน้าเข้าสู่ระบบ',
    resetTitle: 'ตั้งรหัสผ่านใหม่', newPassword: 'รหัสผ่านใหม่', confirmPassword: 'ยืนยันรหัสผ่านใหม่', resetSubmit: 'บันทึกรหัสผ่านใหม่',
    challengeTitle: 'ยืนยันตัวตนสองขั้นตอน', challengeIntro: 'กรอกรหัส 6 หลัก', recoveryIntro: 'กรอกรหัสสำรอง', code: 'รหัส 6 หลัก', recoveryCode: 'รหัสสำรอง',
    useRecoveryCode: 'ใช้รหัสสำรองแทน', useCode: 'ใช้รหัสจากแอปแทน', verify: 'ยืนยัน', logout: 'ออกจากระบบ', cancel: 'ยกเลิก',
    setupTitle: 'ตั้งค่า', setupIntro: 'ต้องตั้งค่า', setupRenewIntro: 'สแกนใหม่', setupScan: 'สแกน QR', setupManual: 'กรอกคีย์', setupConfirm: 'กรอกรหัส', setupSubmit: 'ยืนยันและเปิดใช้',
    recoveryCodesTitle: 'เก็บรหัสสำรองไว้', recoveryCodesIntro: 'รหัสละครั้ง', copyCodes: 'คัดลอกรหัส', continue: 'ไปต่อ',
    twoFactor: 'ยืนยันตัวตนสองขั้นตอน', twoFactorOn: 'ใช้รหัสจากแอป', twoFactorOff: 'เปิดใช้เพื่อความปลอดภัย', twoFactorRequiredNote: 'ปิดไม่ได้', recoveryCodesLeft: 'เหลือรหัสสำรอง :count ชุด',
    enableTwoFactor: 'เปิดใช้', renewTwoFactor: 'เปลี่ยนโทรศัพท์', regenerateCodes: 'สร้างรหัสสำรองใหม่', newRecoveryCodes: 'รหัสสำรองชุดใหม่', disableTwoFactor: 'ปิดการใช้', disableConfirm: 'ยืนยันด้วยรหัสผ่าน',
}

const profileLabels = { title: 'โปรไฟล์', details: 'ข้อมูลส่วนตัว', name: 'ชื่อ', email: 'อีเมล', avatar: 'รูปโปรไฟล์', changeAvatar: 'เปลี่ยนรูป', removeAvatar: 'ลบรูป', save: 'บันทึก', password: 'เปลี่ยนรหัสผ่าน', currentPassword: 'รหัสผ่านปัจจุบัน', newPassword: 'รหัสผ่านใหม่', confirmPassword: 'ยืนยันรหัสผ่านใหม่', savePassword: 'เปลี่ยนรหัสผ่าน' }

const cases = [
    ['tungsten::UiKit', { toastUrl: '/admin/ui-kit/toast' }, 'Metabase'],
    ['tungsten::Home', { title: 'ร้านค้า', description: '' }, 'คำสั่งซื้อ'],
    ['tungsten::errors/Error', { status: 404, home: '/admin' }, '404'],
    ['panel/orders/Index', { title: 'คำสั่งซื้อ', table }, 'คำสั่งซื้อ'],
    ['tungsten::auth/Profile', { labels: { title: 'โปรไฟล์', details: 'ข้อมูลส่วนตัว', name: 'ชื่อ', email: 'อีเมล', avatar: 'รูปโปรไฟล์', changeAvatar: 'เปลี่ยนรูป', removeAvatar: 'ลบรูป', save: 'บันทึก', password: 'เปลี่ยนรหัสผ่าน', currentPassword: 'รหัสผ่านปัจจุบัน', newPassword: 'รหัสผ่านใหม่', confirmPassword: 'ยืนยันรหัสผ่านใหม่', savePassword: 'เปลี่ยนรหัสผ่าน' }, profile: { name: 'Admin', email: 'admin@example.com', avatar: null }, withAvatar: true, updateUrl: '/admin/profile', passwordUrl: '/admin/profile/password' }, 'รหัสผ่านปัจจุบัน'],
    ['tungsten::auth/Profile', { labels: { title: 'โปรไฟล์', details: 'ข้อมูลส่วนตัว', name: 'ชื่อ', email: 'อีเมล', avatar: 'รูปโปรไฟล์', changeAvatar: 'เปลี่ยนรูป', removeAvatar: 'ลบรูป', save: 'บันทึก', password: 'เปลี่ยนรหัสผ่าน', currentPassword: 'รหัสผ่านปัจจุบัน', newPassword: 'รหัสผ่านใหม่', confirmPassword: 'ยืนยันรหัสผ่านใหม่', savePassword: 'เปลี่ยนรหัสผ่าน', emailLocked: 'เปลี่ยนอีเมลเองไม่ได้ ติดต่อผู้ดูแลระบบ' }, profile: { name: 'Admin', email: 'admin@example.com', avatar: null }, withAvatar: true, emailEditable: false, updateUrl: '/admin/profile', passwordUrl: '/admin/profile/password' }, 'เปลี่ยนอีเมลเองไม่ได้ ติดต่อผู้ดูแลระบบ'],
    ['tungsten::auth/Login', { labels: { title: 'เข้าสู่ระบบ', intro: '', email: 'อีเมล', password: 'รหัสผ่าน', remember: 'จดจำ', submit: 'เข้าสู่ระบบ', forgot: 'ลืมรหัสผ่าน?' }, action: '/admin/login', forgotPasswordUrl: '/forgot-password' }, 'ลืมรหัสผ่าน?'],
    ['tungsten::auth/ForgotPassword', { labels: authLabels, action: '/admin/forgot-password', loginUrl: '/admin/login' }, 'ส่งลิงก์ตั้งรหัสผ่านใหม่'],
    ['tungsten::auth/ResetPassword', { labels: authLabels, action: '/admin/reset-password', token: 't0k3n', email: 'a@example.com', forgotUrl: '/admin/forgot-password' }, 'บันทึกรหัสผ่านใหม่'],
    ['tungsten::auth/ResetPassword', { labels: authLabels, action: '/admin/reset-password', token: 't0k3n', email: 'a@example.com', forgotUrl: '/admin/forgot-password' }, 'aria-label="แสดงรหัสผ่าน"'],
    ['tungsten::auth/TwoFactorChallenge', { labels: authLabels, action: '/admin/two-factor-challenge', loginUrl: '/admin/login', logoutUrl: null }, 'ใช้รหัสสำรองแทน'],
    ['tungsten::auth/TwoFactorChallenge', { labels: { ...authLabels, rememberDevice: 'ไม่ต้องถามรหัสในเครื่องนี้อีก :days วัน' }, action: '/admin/two-factor-challenge', loginUrl: '/admin/login', logoutUrl: null, rememberDays: 30 }, 'ไม่ต้องถามรหัสในเครื่องนี้อีก 30 วัน'],
    ['tungsten::auth/TwoFactorSetup', { labels: authLabels, renew: false, required: true, qr: '<svg xmlns="http://www.w3.org/2000/svg"></svg>', secret: 'ABCD EFGH', action: '/admin/two-factor/setup', logoutUrl: '/admin/logout', cancelUrl: null }, 'ABCD EFGH'],
    ['tungsten::auth/TwoFactorSetup', { labels: authLabels, recoveryCodes: ['aaaaa-11111', 'bbbbb-22222'], continueUrl: '/admin' }, 'bbbbb-22222'],
    ['tungsten::auth/Profile', { labels: { ...profileLabels, ...authLabels }, profile: { name: 'Admin', email: 'admin@example.com', avatar: null }, withAvatar: false, updateUrl: '/admin/profile', passwordUrl: '/admin/profile/password', twoFactor: { enabled: true, required: false, status: { label: 'เปิดใช้อยู่', tone: 'done' }, recoveryCodesLeft: 7, newRecoveryCodes: null, setupUrl: '/s', renewUrl: '/s?renew=1', regenerateUrl: '/r', disableUrl: '/d' } }, 'เหลือรหัสสำรอง 7 ชุด'],
]

for (const [component, props, expected] of cases) {
    const page = { component, props: { ...shared, ...props }, url: '/admin/orders', version: null, clearHistory: false, encryptHistory: false }
    const { body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })

    if (!body.includes(expected)) {
        throw new Error(`${component}: rendered HTML is missing "${expected}"`)
    }

    console.log(`ssr ok  ${component}  (${body.length} bytes)`)
}

// A page width caps the content inside the sheet, which keeps its full size.
{
    const page = { component: 'panel/orders/Index', props: { ...shared, title: 'คำสั่งซื้อ', table, layout: { sheet: true, width: '4xl' } }, url: '/admin/orders', version: null, clearHistory: false, encryptHistory: false }
    const { body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })
    const main = body.slice(body.indexOf('<main'))

    if (!/<main[^>]*class="[^"]*\bbg-sheet\b[^"]*"[^>]*><div class="min-w-0 max-w-4xl">/.test(main)) {
        throw new Error('width 4xl: expected the sheet <main> to hold a max-w-4xl content box')
    }

    console.log('ssr ok  width 4xl caps the content inside a full sheet')
}

// `fit` shrinks the content to its widest child (a list with few columns), the sheet still full size.
{
    const page = { component: 'panel/orders/Index', props: { ...shared, title: 'คำสั่งซื้อ', table, layout: { sheet: true, width: 'fit' } }, url: '/admin/orders', version: null, clearHistory: false, encryptHistory: false }
    const { body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })
    const main = body.slice(body.indexOf('<main'))

    if (!/<main[^>]*class="[^"]*\bbg-sheet\b[^"]*"[^>]*><div class="min-w-0 w-fit max-w-full">/.test(main)) {
        throw new Error('width fit: expected the sheet <main> to hold a w-fit content box')
    }

    console.log('ssr ok  width fit fits the content inside a full sheet')
}

// `align: 'center'` centres a capped page, `fit` too; a `full` page has nothing to centre.
for (const [width, box] of [['4xl', 'min-w-0 max-w-4xl mx-auto'], ['fit', 'min-w-0 w-fit max-w-full mx-auto']]) {
    const page = { component: 'panel/orders/Index', props: { ...shared, title: 'คำสั่งซื้อ', table, layout: { sheet: true, width, align: 'center' } }, url: '/admin/orders', version: null, clearHistory: false, encryptHistory: false }
    const { body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })
    const main = body.slice(body.indexOf('<main'))

    if (!main.includes(`><div class="${box}">`)) {
        throw new Error(`align center, width ${width}: expected a "${box}" content box`)
    }

    console.log(`ssr ok  align center centres a ${width} page`)
}

{
    const page = { component: 'panel/orders/Index', props: { ...shared, title: 'คำสั่งซื้อ', table, layout: { sheet: true, align: 'center' } }, url: '/admin/orders', version: null, clearHistory: false, encryptHistory: false }
    const { body } = await createTungstenApp({ pages, prefix: './resources/js/pages/', page, render: renderToString })

    if (body.includes('mx-auto')) {
        throw new Error('align center on a full page: expected no centred content box')
    }

    console.log('ssr ok  align center leaves a full page alone')
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

// The rich-text editor renders on the server too (Tiptap builds the editor only in the browser).
{
    const html = renderToString(<RichText value="<p>สวัสดี</p>" onChange={() => {}} />)

    if (!html.includes('aria-label="ตัวหนา"')) {
        throw new Error('RichText: toolbar missing from the server render')
    }

    console.log('ssr ok  RichText toolbar (editor mounts in the browser)')
}
