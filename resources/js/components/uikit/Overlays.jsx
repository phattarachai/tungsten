import { router } from '@inertiajs/react'
import { CalendarDays, RefreshCw, Truck } from 'lucide-react'
import { useState } from 'react'

import { dismissToast, NO_TOASTS, pushToasts } from '../../lib/notices'
import { NoticeToasts } from '../panel/NoticeToasts'
import { Button, ConfirmDialog, Dialog, FormDialog, FormField, Input, PickerDialog, Section, Stepper, Timeline, TimelineEvent } from '../ui'
import { GALLERY, Row } from './shared'

export function Progress() {
    return (
        <Section id="progress" title="Stepper · Timeline">
            <div className="space-y-3">
                <Stepper
                    steps={[
                        { key: 'placed', label: 'สั่งซื้อ', state: 'done', meta: ['19 ต.ค. 69 09:12'] },
                        { key: 'paid', label: 'ชำระเงิน', state: 'done' },
                        { key: 'packed', label: 'แพ็กสินค้า', state: 'current' },
                        { key: 'shipped', label: 'ส่งของ', state: 'todo' },
                        { key: 'done', label: 'สำเร็จ', state: 'end' },
                    ]}
                />
                <Timeline>
                    <TimelineEvent kind="in" icon={CalendarDays} label="ลูกค้า">
                        สั่งซื้อ 3 รายการ
                    </TimelineEvent>
                    <TimelineEvent kind="system" icon={RefreshCw} label="ระบบ">
                        ยืนยันการชำระเงิน
                    </TimelineEvent>
                    <TimelineEvent kind="out" icon={Truck} label="แอดมิน">
                        ส่งเลขพัสดุ TH0123456789
                    </TimelineEvent>
                </Timeline>
            </div>
        </Section>
    )
}

const NOTICES = [
    { title: 'ชำระเงินแล้ว', body: 'คำสั่งซื้อ SO-2611-0042\nร้านยาบ้านสวน\n฿1,290', url: null, tone: 'done', icon: 'wallet' },
    { title: 'สลิปรอตรวจ', body: 'คำสั่งซื้อ SO-2611-0041', url: null, tone: 'todo', icon: 'file-text' },
    { title: 'สำรองข้อมูลไม่สำเร็จ', body: null, url: null, tone: 'failed', icon: 'database' },
    { title: 'ส่งสินค้าแล้ว', body: null, url: null, tone: 'active', icon: 'truck' },
    { title: 'ลูกค้าใหม่', body: null, url: null, tone: null, icon: null },
]

export function Overlays({ toastUrl }) {
    const [picking, setPicking] = useState(false)
    const [picked, setPicked] = useState({ 1: 2 })
    const [open, setOpen] = useState(null)
    const [notices, setNotices] = useState(NO_TOASTS)

    function arrive(count) {
        const now = Date.now()
        const items = NOTICES.slice(0, count).map((item, index) => ({ ...item, id: `${now}-${index}`, read: false, at: new Date(now).toISOString() }))

        setNotices((stack) => pushToasts(stack, items, now))
    }

    function toast(tone) {
        router.post(toastUrl, { tone }, { preserveScroll: true, preserveState: true })
    }

    return (
        <Section id="overlays" title="Dialog · Toast">
            <Row label="Dialog">
                <Button size="sm" variant="outline" onClick={() => setOpen('dialog')}>
                    Dialog
                </Button>
                <Button size="sm" variant="outline" onClick={() => setOpen('form')}>
                    FormDialog
                </Button>
                <Button size="sm" variant="outline" tone="danger" onClick={() => setOpen('confirm')}>
                    ConfirmDialog
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPicking(true)}>
                    PickerDialog
                </Button>
            </Row>
            <PickerDialog
                open={picking}
                title="เพิ่มสินค้า"
                placeholder="ค้นหาชื่อสินค้า"
                options={GALLERY.map((image, index) => ({ value: index + 1, title: image.alt, subtitle: index === 1 ? 'หมดสต็อก' : 'คงเหลือ 12', meta: `฿${(index + 1) * 190}`, image: image.src, disabled: index === 1 }))}
                counts={picked}
                onPick={(option) => setPicked((current) => ({ ...current, [option.value]: (current[option.value] ?? 0) + 1 }))}
                onClose={() => setPicking(false)}
            />
            {toastUrl && (
                <Row label="Toast">
                    <Button size="sm" variant="outline" tone="neutral" onClick={() => toast('success')}>
                        success
                    </Button>
                    <Button size="sm" variant="outline" tone="blue" onClick={() => toast('info')}>
                        info
                    </Button>
                    <Button size="sm" variant="outline" tone="amber" onClick={() => toast('warning')}>
                        warning
                    </Button>
                    <Button size="sm" variant="outline" tone="danger" onClick={() => toast('error')}>
                        error
                    </Button>
                </Row>
            )}
            <Row label="NotificationBell live">
                <Button size="sm" variant="outline" onClick={() => arrive(1)}>
                    1 รายการ
                </Button>
                <Button size="sm" variant="outline" onClick={() => arrive(5)}>
                    5 รายการ
                </Button>
            </Row>
            <NoticeToasts stack={notices} onChange={setNotices} onOpen={(item) => setNotices((stack) => dismissToast(stack, item.id))} onMore={() => {}} />
            <Dialog open={open === 'dialog'} onClose={() => setOpen(null)} title="สินค้าในคำสั่งซื้อ (4)">
                <p className="text-zinc-600">Dialog อ่านอย่างเดียว ปิดได้ด้วยการคลิกนอกกล่อง</p>
            </Dialog>
            {open === 'form' && (
                <FormDialog title="แก้ไขสินค้า" onSubmit={() => setOpen(null)} onClose={() => setOpen(null)}>
                    <FormField label="ชื่อ">
                        <Input defaultValue="วิตามินซี 1000" />
                    </FormField>
                </FormDialog>
            )}
            <ConfirmDialog open={open === 'confirm'} title="ลบสินค้า วิตามินซี 1000" confirmLabel="ลบ" tone="danger" onConfirm={() => setOpen(null)} onClose={() => setOpen(null)}>
                ลบสินค้าและราคาทั้งหมดของสินค้านี้
            </ConfirmDialog>
        </Section>
    )
}
