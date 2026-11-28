import { Download, Filter, Plus, Printer, SquarePen, Trash2, Truck, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { LastEdited } from '../panel/LastEdited'
import { ActionMenu, Badge, Button, ButtonBar, ButtonGroup, Chart, CopyButton, IconButton, Pills, RecordPager, RowActions, SearchInput, Section, Switch, SyncButton, Thumb } from '../ui'
import { Dropdown, DropdownOption, DropdownSection } from '../ui/Dropdown'
import { GALLERY, Row } from './shared'

const RAMP = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const BADGE_TONES = ['zinc', 'brand', 'green', 'amber', 'red', 'blue']

const CLICKS = Array.from({ length: 30 }, (_, index) => ({ label: `${index + 1} ต.ค.`, value: [3, 7, 4, 0, 12, 9, 5][index % 7] + (index > 20 ? 6 : 0) }))

const STATUS_TONES_DEMO = [
    ['draft', 'ร่าง'],
    ['waiting', 'รอลูกค้าชำระ'],
    ['todo', 'ที่ต้องจัดส่ง'],
    ['active', 'กำลังจัดส่ง'],
    ['done', 'สำเร็จ'],
    ['canceled', 'ยกเลิก'],
    ['failed', 'ส่งไม่สำเร็จ'],
]
const BUTTON_TONES = ['neutral', 'brand', 'amber', 'blue', 'danger']

export function Theme() {
    return (
        <Section id="theme" title="ธีม" hint="steel · graphite rail · IBM Plex Sans Thai">
            <Row label="zinc (steel)">
                <div className="flex overflow-hidden rounded border border-zinc-200">
                    {RAMP.map((step) => (
                        <span key={step} className="flex h-10 w-11 items-end p-1 text-[0.5625rem] tabular-nums" style={{ background: `var(--color-zinc-${step})`, color: step >= 500 ? '#fff' : 'var(--color-zinc-700)' }}>
                            {step}
                        </span>
                    ))}
                </div>
            </Row>
            <Row label="rail ของ panel นี้">
                <div className="flex overflow-hidden rounded">
                    {['rail', 'rail-hover', 'rail-active', 'rail-line'].map((token) => (
                        <span key={token} className="panel-rail flex h-10 w-20 items-end p-1 text-[0.5625rem] text-rail-ink" style={{ background: `var(--color-${token})` }}>
                            {token}
                        </span>
                    ))}
                </div>
            </Row>
            <Row label="brand">
                <span className="h-6 w-10 rounded bg-brand" />
                <span className="h-6 w-10 rounded bg-brand-600" />
                <span className="h-6 w-10 rounded border border-zinc-200 bg-brand-50" />
                <span className="font-medium text-brand tabular-nums">C-10241</span>
            </Row>
            <Row label="ตัวอักษร">
                <div className="space-y-1">
                    <p className="text-lg font-semibold text-zinc-900">คำสั่งซื้อ · หัวหน้า</p>
                    <p className="text-xs font-semibold text-zinc-800">หัว Section รายการสินค้า</p>
                    <p className="text-xs text-zinc-800">เนื้อหา ร้านยาสุขภาพดี สาขาลาดพร้าว 1,290.00 บาท</p>
                    <p className="text-[0.6875rem] text-zinc-500">คำอธิบายรอง 7 พ.ค. 69 08:45 – 22 ต.ค. 69 18:30</p>
                    <p className="text-[0.625rem] font-medium text-zinc-500">หัวตาราง · ยอดรวม</p>
                </div>
            </Row>
        </Section>
    )
}

export function Buttons() {
    const [view, setView] = useState('table')

    return (
        <Section id="buttons" title="Button" hint="variant × tone · size sm ใช้ในหัว Section">
            {['solid', 'outline', 'ghost'].map((variant) => (
                <Row key={variant} label={variant}>
                    {BUTTON_TONES.map((tone) => (
                        <Button key={tone} size="sm" variant={variant} tone={tone}>
                            {tone}
                        </Button>
                    ))}
                </Row>
            ))}
            <Row label="md / ไอคอน">
                <Button variant="brand">
                    <Plus className="size-4" />
                    เพิ่มคำสั่งซื้อ
                </Button>
                <Button variant="outline">
                    <SquarePen className="size-4" />
                    แก้ไข
                </Button>
                <Button variant="outline" disabled>
                    ปิดอยู่
                </Button>
            </Row>
            <Row label="หัว Section">
                <Button size="sm" variant="outline" tone="brand">
                    <Plus className="size-3.5" />
                    เพิ่ม
                </Button>
                <ActionMenu
                    label="เพิ่มผู้ใช้"
                    icon={UserPlus}
                    items={[
                        { label: 'แอดมิน', hint: 2, onSelect: () => {} },
                        { label: 'พนักงาน', hint: 18, onSelect: () => {} },
                    ]}
                />
                <SyncButton label="ERP" title="ดึงข้อมูลจาก ERP" />
                <ActionMenu items={[{ label: 'Export รายการ', icon: Download, onSelect: () => {} }, { label: 'ลบ', icon: Trash2, tone: 'danger', onSelect: () => {} }]} />
            </Row>
            <Row label="หัว record">
                <LastEdited />
                <span className="h-5 w-px bg-zinc-200" aria-hidden />
                <Button size="sm" variant="outline" tone="amber">
                    <Truck className="size-3.5" />
                    ส่งของ
                </Button>
                <Button size="sm" variant="outline">
                    <SquarePen className="size-3.5" />
                    แก้ไข
                </Button>
                <ActionMenu items={[{ label: 'พิมพ์ใบเสร็จ', icon: Printer, onSelect: () => {} }]} />
                <span className="h-5 w-px bg-zinc-200" aria-hidden />
                <RecordPager previousUrl={null} nextUrl={null} />
            </Row>
            <Row label="ButtonBar">
                <ButtonBar>
                    <Button size="sm" variant="outline" tone="amber">
                        <Truck className="size-3.5" />
                        ส่งของ
                    </Button>
                    <Button size="sm" variant="outline">
                        <SquarePen className="size-3.5" />
                        แก้ไข
                    </Button>
                    <ActionMenu items={[{ label: 'พิมพ์ใบเสร็จ', icon: Printer, onSelect: () => {} }]} />
                </ButtonBar>
            </Row>
            <Row label="ButtonGroup">
                <ButtonGroup
                    options={[
                        { value: 'table', label: 'ตาราง' },
                        { value: 'group', label: 'ตามกลุ่ม' },
                    ]}
                    value={view}
                    onChange={setView}
                />
            </Row>
            <Row label="IconButton / Row">
                <IconButton icon={SquarePen} label="แก้ไข" />
                <IconButton icon={Trash2} label="ลบ" tone="danger" />
                <RowActions items={[{ label: 'แก้ไข', icon: SquarePen, onSelect: () => {} }]} />
                <RowActions items={[{ label: 'ลบ', icon: Trash2, tone: 'danger', onSelect: () => {} }]} />
                <RowActions items={[{ label: 'แก้ไข', icon: SquarePen, onSelect: () => {} }, { label: 'ลบ', icon: Trash2, tone: 'danger', onSelect: () => {} }]} />
            </Row>
        </Section>
    )
}

export function Chips() {
    const [tab, setTab] = useState('open')
    const [search, setSearch] = useState('')
    const [on, setOn] = useState(true)

    return (
        <Section id="chips" title="Badge · Pills · Switch · Search">
            <Row label="Badge">
                {BADGE_TONES.map((tone) => (
                    <Badge key={tone} tone={tone}>
                        {tone}
                    </Badge>
                ))}
            </Row>
            <Row label="Chart">
                <div className="grid w-full gap-4 sm:grid-cols-2">
                    <Chart data={CLICKS} unit="คลิก" tone="done" height="5rem" label="คลิกย้อนหลัง 30 วัน" />
                    <Chart data={CLICKS} type="line" unit="คลิก" height="5rem" label="คลิกย้อนหลัง 30 วัน" />
                </div>
            </Row>
            <Row label="CopyButton">
                <span className="font-mono text-zinc-600">s.example.com/abc</span>
                <CopyButton value="https://s.example.com/abc" label="คัดลอกลิงก์" />
            </Row>
            <Row label="Lightbox">
                {GALLERY.map((image, index) => (
                    <Thumb key={image.alt} src={image.src} alt={image.alt} zoom={{ images: GALLERY, index }} />
                ))}
            </Row>
            <Row label="status tones">
                {STATUS_TONES_DEMO.map(([tone, label]) => (
                    <Badge key={tone} tone={tone}>
                        {label}
                    </Badge>
                ))}
            </Row>
            <Row label="สถานะจริง">
                <Badge tone="green">กำลังใช้</Badge>
                <Badge tone="amber">รอเริ่ม</Badge>
                <Badge tone="zinc">หมดเวลา</Badge>
                <Badge tone="blue">อ้างอิงฐาน</Badge>
                <Badge tone="red">ปิดการใช้งาน</Badge>
            </Row>
            <Row label="Pills">
                <Pills
                    options={[
                        { value: 'open', label: 'ใช้งาน', count: 6 },
                        { value: 'closed', label: 'ปิดแล้ว', count: 8 },
                    ]}
                    value={tab}
                    onChange={setTab}
                />
            </Row>
            <Row label="Switch">
                <Switch checked={on} onChange={setOn} label="แสดงสินค้าหมดสต็อก" />
            </Row>
            <Row label="SearchInput">
                <SearchInput value={search} onChange={setSearch} placeholder="ค้นหา รหัส / ชื่อ / เบอร์โทร…" inputClassName="w-56" />
            </Row>
            <Row label="Dropdown">
                <Dropdown icon={Filter} title="ตัวกรอง" active={tab === 'closed'}>
                    <DropdownSection title="สถานะ">
                        <DropdownOption selected={tab === 'open'} onSelect={() => setTab('open')}>
                            ใช้งาน
                        </DropdownOption>
                        <DropdownOption selected={tab === 'closed'} onSelect={() => setTab('closed')} hint="8">
                            ปิดแล้ว
                        </DropdownOption>
                    </DropdownSection>
                </Dropdown>
                <LastEdited last={{ name: 'Admin A.', initial: 'A', at: '15 ต.ค. 69 10:12' }} />
                <LastEdited />
            </Row>
        </Section>
    )
}
