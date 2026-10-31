import { Head, router } from '@inertiajs/react'
import { CalendarDays, Download, Filter, Plus, Printer, RefreshCw, SquarePen, Trash2, Truck, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { LastEdited } from '../components/panel/LastEdited'
import {
    ActionMenu,
    AvatarStack,
    Badge,
    branchIds,
    Button,
    ButtonBar,
    ButtonGroup,
    Card,
    CardHeader,
    ColumnsMenu,
    Combobox,
    ConfirmDialog,
    DataList,
    DataTable,
    DatePicker,
    DateRangePicker,
    DateTimePicker,
    DetailList,
    Dialog,
    Filters,
    FormDialog,
    FormField,
    GroupedNav,
    IconButton,
    Input,
    PageHeader,
    Pagination,
    Pills,
    RecordPager,
    RowActions,
    SearchInput,
    Section,
    SectionGrid,
    Select,
    SelectionBar,
    Stepper,
    Switch,
    SyncButton,
    TabSection,
    Textarea,
    Thumb,
    Timeline,
    TimelineEvent,
    TreeTable,
} from '../components/ui'
import { Dropdown, DropdownOption, DropdownSection } from '../components/ui/Dropdown'
import { AppLayout } from '../layouts/AppLayout'
import { useColumnVisibility } from '../lib/useColumnVisibility'

/*
 | The kit on one page: every primitive in its states, drawn in the current panel's theme. Mounted by
 | Phattarachai\Tungsten\Pages\UiKitPage. When a kit piece gains a variant, add it here.
 */

const RAMP = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const BADGE_TONES = ['zinc', 'brand', 'green', 'amber', 'red', 'blue']
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

const CUSTOMERS = [
    { id: 'C-10241', name: 'ร้านยาสุขภาพดี สาขาลาดพร้าว', group: 'ร้านยา', limit: 500000, used: 182400, status: 'ปกติ' },
    { id: 'C-10388', name: 'คลินิกหมอฟันยิ้มสวย', group: null, limit: 250000, used: 61200, status: 'ปกติ' },
    { id: 'C-11502', name: 'บริษัท เฮลท์ตี้ช็อป จำกัด', group: 'ตัวแทนจำหน่าย', limit: 1200000, used: 1265000, status: 'เกินวงเงิน' },
    { id: 'C-11977', name: 'ร้านค้าออนไลน์ บ้านสมุนไพร', group: 'ออนไลน์', limit: 300000, used: 0, status: 'ปิดการใช้งาน' },
]

const STATUS_TONES = { ปกติ: 'green', เกินวงเงิน: 'red', ปิดการใช้งาน: 'zinc' }

const RULES = [
    { id: 1, name: 'วิตามินซี 1000', products: 'หมวด วิตามิน · แบรนด์ HealthPlus', skus: 12, price: 390 },
    { id: 2, name: 'คอลลาเจน', products: 'หมวด ความงาม · ผง / เม็ด', skus: 27, price: 590 },
    { id: 3, name: 'เจลล้างมือ', products: 'หมวด ของใช้ · 50 / 250 / 500 มล.', skus: 8, price: 89 },
    { id: 4, name: 'หน้ากากอนามัย', products: 'หมวด ของใช้ · กล่อง 50 ชิ้น', skus: 5, price: 120 },
]

const money = (value) => value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const CUSTOMER_COLUMNS = [
    { key: 'id', label: 'รหัสลูกค้า', primary: true, sortable: true },
    { key: 'name', label: 'ชื่อลูกค้า', className: 'w-full', sortable: true },
    { key: 'group', label: 'กลุ่ม', toggleable: true, render: (row) => row.group ?? <span className="text-zinc-300">—</span> },
    { key: 'limit', label: 'วงเงิน', align: 'right', sortable: true, toggleable: true, render: (row) => row.limit.toLocaleString('th-TH') },
    { key: 'status', label: 'สถานะ', toggleable: true, render: (row) => <Badge tone={STATUS_TONES[row.status]}>{row.status}</Badge> },
]

const RULE_COLUMNS = [
    { key: 'name', label: 'สินค้า', primary: true },
    { key: 'products', label: 'รายละเอียด', className: 'w-full' },
    { key: 'skus', label: 'SKU', align: 'right' },
    { key: 'price', label: 'ราคา', align: 'right', render: (row) => money(row.price) },
]

const OPTIONS = [
    { value: 'vitamin', label: 'วิตามิน' },
    { value: 'beauty', label: 'ความงาม' },
    { value: 'supplies', label: 'ของใช้' },
    { value: 'herbal', label: 'สมุนไพร' },
]

const preventVisit = { onClick: (event) => event.preventDefault() }

function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 py-1.5">
            <span className="text-[0.6875rem] text-zinc-500">{label}</span>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    )
}

function Theme() {
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

function Buttons() {
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

function Chips() {
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

function Forms() {
    const [category, setCategory] = useState('vitamin')
    const [categories, setCategories] = useState(['vitamin', 'beauty'])

    return (
        <Section id="forms" title="ฟอร์ม" hint="label อยู่ซ้าย · stacked เฉพาะช่องที่ต้องกว้าง">
            <div className="space-y-2.5">
                <FormField label="ชื่อสินค้า" htmlFor="kit-name">
                    <Input id="kit-name" defaultValue="วิตามินซี 1000" />
                </FormField>
                <FormField label="ราคา" hint="บาท" info="ราคาที่ลูกค้าเห็นก่อนส่วนลด">
                    <Input defaultValue="390.00" className="tabular-nums" />
                </FormField>
                <FormField label="การจัดส่ง">
                    <Select defaultValue="fixed">
                        <option value="fixed">ส่งพัสดุ</option>
                        <option value="reference">รับที่ร้าน</option>
                    </Select>
                </FormField>
                <FormField label="หมวด">
                    <Combobox options={OPTIONS} value={category} onChange={setCategory} />
                </FormField>
                <FormField label="หมวด หลายค่า">
                    <Combobox options={OPTIONS} value={categories} onChange={setCategories} multiple clearable />
                </FormField>
                <FormField label="รหัสลูกค้า" error="ไม่พบลูกค้า C-99999">
                    <Input defaultValue="C-99999" aria-invalid />
                </FormField>
                <FormField label="หมายเหตุ" stacked>
                    <Textarea rows={2} defaultValue="ส่งก่อนเที่ยง ติดต่อหน้าร้าน" />
                </FormField>
            </div>
        </Section>
    )
}

function Tables() {
    const [selection, setSelection] = useState([])
    const visibility = useColumnVisibility('tungsten-ui-kit-columns', CUSTOMER_COLUMNS)

    return (
        <Section
            id="tables"
            title="DataTable"
            hint="primary · sortable · selection · rowActions · ColumnsMenu"
            flush
            actions={<ColumnsMenu columns={CUSTOMER_COLUMNS} visibility={visibility} />}
        >
            {selection.length > 0 && (
                <SelectionBar count={selection.length} unit="ลูกค้า" onClear={() => setSelection([])}>
                    <Button size="sm" variant="outline">
                        ส่งข้อความ
                    </Button>
                </SelectionBar>
            )}
            <DataTable
                flush
                columns={visibility.visible}
                rows={CUSTOMERS}
                rowHref={() => '#tables'}
                selection={selection}
                onSelectionChange={setSelection}
                defaultSort={{ key: 'id', dir: 'asc' }}
                rowActions={() => [
                    { label: 'แก้ไข', icon: SquarePen, onSelect: () => {} },
                    { label: 'ลบ', icon: Trash2, tone: 'danger', onSelect: () => {} },
                ]}
            />
        </Section>
    )
}

function GroupedTable() {
    return (
        <Section id="groups" title="DataTable groups + summary" flush>
            <DataTable
                flush
                columns={RULE_COLUMNS}
                groups={[
                    { key: 'health', label: 'สุขภาพ', hint: '2 สินค้า', rows: RULES.slice(0, 2), summary: { skus: 39 } },
                    { key: 'supplies', label: 'ของใช้', rows: RULES.slice(2), summary: { skus: 13 } },
                ]}
            />
        </Section>
    )
}

const ORDERS = [
    {
        id: 'SO-10241',
        customer: 'ภัทรา ใจดี',
        items: [
            { name: 'วิตามินซี 1000 มก.', qty: 2, image: null },
            { name: 'คอลลาเจน ผง 200 ก.', qty: 1, image: null },
        ],
        staff: [{ name: 'กมล' }, { name: 'ศิริพร' }, { name: 'อนันต์' }, { name: 'มณี' }, { name: 'ธนา' }],
    },
    { id: 'SO-10240', customer: 'สมชาย มั่นคง', items: [{ name: 'น้ำมันปลา 60 แคปซูล', qty: 3, image: null }], staff: [{ name: 'กมล' }] },
]

const ORDER_COLUMNS = [
    { key: 'id', label: 'เลขที่', primary: true },
    { key: 'customer', label: 'ลูกค้า' },
    {
        key: 'items',
        label: 'สินค้า',
        valign: 'top',
        className: 'py-1',
        render: (row) => (
            <div className="space-y-1">
                {row.items.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <Thumb src={item.image} className="size-6" />
                        <span>{item.name}</span>
                        <span className="text-zinc-400">×{item.qty}</span>
                    </div>
                ))}
            </div>
        ),
    },
    { key: 'staff', label: 'พนักงาน', render: (row) => <AvatarStack people={row.staff} max={3} /> },
]

const SHIPPING = [
    { value: 'pending', label: 'รอจัดส่ง', count: 12, tone: 'todo' },
    { value: 'shipped', label: 'ส่งแล้ว', count: 340 },
    { value: 'returned', label: 'ตีกลับ', count: 2 },
]

const FILTERS = [
    {
        key: 'date',
        label: 'วันที่สั่ง',
        type: 'dates',
        options: [
            { value: 'today', label: 'วันนี้' },
            { value: 'week', label: '7 วัน' },
            { value: 'month', label: '30 วัน' },
        ],
    },
    {
        key: 'channel',
        label: 'ช่องทาง',
        type: 'select',
        multiple: true,
        options: [
            { value: 'line', label: 'LINE' },
            { value: 'web', label: 'เว็บไซต์' },
            { value: 'shopee', label: 'Shopee' },
            { value: 'lazada', label: 'Lazada' },
        ],
    },
    {
        key: 'paid',
        label: 'ชำระเงิน',
        type: 'select',
        options: [
            { value: 'paid', label: 'ชำระแล้ว' },
            { value: 'unpaid', label: 'ยังไม่ชำระ' },
        ],
    },
    { key: 'vip', label: 'ลูกค้า VIP', type: 'toggle' },
    { key: 'shipping', label: 'จัดส่ง', type: 'buttons', default: 'pending', options: SHIPPING },
]

function Filtering() {
    const [layout, setLayout] = useState('bar')
    const [values, setValues] = useState({ channel: ['line'], shipping: 'pending' })
    const [perPage, setPerPage] = useState(25)

    return (
        <Section
            id="filters"
            title="Filters · AvatarStack · Thumb"
            hint="ตัวกรองชุดเดียว แสดงได้สองแบบ"
            actions={
                <ButtonGroup
                    size="sm"
                    options={[
                        { value: 'bar', label: 'bar' },
                        { value: 'menu', label: 'menu' },
                    ]}
                    value={layout}
                    onChange={setLayout}
                />
            }
            flush
        >
            <div className="px-2.5">
                <Filters
                    flush
                    layout={layout}
                    filters={FILTERS}
                    values={values}
                    onChange={(changes) => setValues((current) => ({ ...current, ...changes }))}
                    search={{ value: values.search, placeholder: 'ค้นหาเลขที่ ชื่อ เบอร์โทร', className: 'w-48' }}
                />
                <DataTable flush columns={ORDER_COLUMNS} rows={ORDERS} rowHref={() => '#filters'} plainLinks />
                <Pagination flush paginator={{ current_page: 1, last_page: 4, per_page: perPage, total: 96, from: 1, to: Math.min(perPage, 96) }} onPage={() => {}} onPerPage={setPerPage} />
            </div>
        </Section>
    )
}

function Lists() {
    const [page, setPage] = useState(1)

    return (
        <Section id="lists" title="DataList · Pagination · Empty" flush>
            <DataList
                rows={CUSTOMERS.slice(0, 3)}
                label="ลูกค้า"
                lead={{ label: 'รหัส', width: 'w-24', render: (row) => <span className="font-medium text-brand tabular-nums">{row.id}</span> }}
                title={(row) => row.name}
                subtitle={(row) => row.group ?? 'ไม่มีกลุ่ม'}
                meta={(row) => [row.status, `วงเงิน ${row.limit.toLocaleString('th-TH')}`]}
                columns={[{ key: 'used', label: 'ใช้ไป', width: 'w-24', align: 'right', render: (row) => row.used.toLocaleString('th-TH') }]}
                actions={() => [{ label: 'แก้ไข', icon: SquarePen, onSelect: () => {} }]}
            />
            <div className="border-t border-zinc-100 px-2.5 py-1.5">
                <Pagination paginator={{ current_page: page, last_page: 3, total: 62, from: (page - 1) * 25 + 1, to: Math.min(page * 25, 62) }} onPage={setPage} />
            </div>
            <DataTable flush columns={RULE_COLUMNS} rows={[]} empty="ไม่มีสินค้าในหมวดนี้" />
        </Section>
    )
}

function Containers() {
    return (
        <>
            <TabSection
                tabs={[
                    { key: 'details', label: 'รายละเอียด', content: <DetailList items={[{ label: 'ช่วงเวลา', value: '7 พ.ค. 69 08:45 – 22 ต.ค. 69 18:30' }, { label: 'ใช้กับ', value: '14 ลูกค้า' }, { label: 'กลุ่ม', value: null }]} /> },
                    { key: 'items', label: 'สินค้า', count: 4, hint: 'TabSection', content: <p className="p-2.5 text-zinc-500">แท็บที่สอง</p> },
                ]}
                flush
            />
            <Card className="p-3">
                <CardHeader title="Card" description="กล่องสำหรับหน้า dashboard / settings" actions={<Badge tone="green">เปิด</Badge>} />
                <p className="mt-2 text-zinc-600">Card ไม่มี padding ในตัว หน้าใส่เอง</p>
            </Card>
        </>
    )
}

function Navs() {
    return (
        <Section id="navs" title="GroupedNav · NavList · RecordPager">
            <div className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
                <GroupedNav
                    className="lg:static lg:max-h-none"
                    linkProps={preventVisit}
                    items={[
                        { key: 'details', label: 'รายละเอียด', href: '#', active: false, group: { key: 'customer', label: 'ลูกค้า', icon: 'building-2' } },
                        { key: 'users', label: 'ผู้ใช้งาน', href: '#', meta: 20, active: false, group: { key: 'customer', label: 'ลูกค้า', icon: 'building-2' } },
                        { key: 'orders', label: 'คำสั่งซื้อ', href: '#', meta: 31, active: true, group: { key: 'sales', label: 'การขาย', icon: 'shopping-cart' } },
                        { key: 'points', label: 'แต้มสะสม', href: '#', badge: { label: 'เปิด', tone: 'green' }, active: false, group: { key: 'sales', label: 'การขาย', icon: 'shopping-cart' } },
                    ]}
                />
                <div className="space-y-2">
                    <RecordPager previousUrl={null} nextUrl={null} />
                    <p className="text-[0.6875rem] text-zinc-500">‹ › อยู่ขวาสุดของหัว record เสมอ แยกจากปุ่มอื่น</p>
                </div>
            </div>
        </Section>
    )
}

const TREE_COLUMNS = [
    { key: 'name', label: 'ภาค / พนักงานขาย', className: 'w-1/2' },
    { key: 'support', label: 'ผู้ช่วย' },
    { key: 'customers', label: 'ลูกค้า', align: 'right' },
]

const TREE_NODES = [
    {
        id: 'north',
        type: 'group',
        label: 'ภาคเหนือ',
        meta: '3 ทีม · 94 ลูกค้า',
        children: [
            {
                id: 'm-1',
                type: 'branch',
                label: (
                    <span className="flex items-center gap-1.5">
                        <b>สมชาย ใจดี</b>
                        <Badge>หัวหน้าทีม</Badge>
                    </span>
                ),
                meta: '2 ทีม · 72 ลูกค้า',
                children: [
                    { id: 'l-369', cells: { name: 'S-369 · สมหญิง รักงาน', support: 'มานี มีนา', customers: 50 } },
                    { id: 'l-408', cells: { name: 'S-408 · ปิติ ยินดี', support: <Badge tone="amber">ลา 20–24 ต.ค.</Badge>, customers: 22 } },
                ],
            },
        ],
    },
    { id: 'loose', type: 'group', label: 'ยังไม่มีภาค', meta: '1 ทีม', children: [{ id: 'l-407', cells: { name: 'S-407 · ชูใจ สบายดี', support: '—', customers: 22 } }] },
]

function TreeTableDemo() {
    const [collapsed, setCollapsed] = useState(new Set())
    const [selected, setSelected] = useState('l-408')
    const toggle = (id) => setCollapsed((current) => new Set(current.has(id) ? [...current].filter((key) => key !== id) : [...current, id]))
    const withSelection = (nodes) =>
        nodes.map((node) => ({ ...node, selected: node.id === selected, onSelect: node.cells ? () => setSelected(node.id) : undefined, children: node.children && withSelection(node.children) }))

    return (
        <Section
            id="tree"
            title="TreeTable"
            hint="group · branch (ย่อได้) · row · selected"
            flush
            actions={
                <Button size="sm" variant="outline" onClick={() => setCollapsed(collapsed.size ? new Set() : new Set(branchIds(TREE_NODES)))}>
                    {collapsed.size ? 'ขยายทั้งหมด' : 'ย่อทั้งหมด'}
                </Button>
            }
        >
            <TreeTable className="rounded-none border-0" columns={TREE_COLUMNS} nodes={withSelection(TREE_NODES)} collapsed={collapsed} onToggle={toggle} />
        </Section>
    )
}

function Dates() {
    const [date, setDate] = useState('2026-10-19')
    const [dateTime, setDateTime] = useState('')
    const [range, setRange] = useState({ start: '2026-10-01', end: '2026-10-31' })

    return (
        <Section id="dates" title="DatePicker · พ.ศ." hint="ค่าเป็น ISO ค.ศ. · แสดงเป็น พ.ศ.">
            <div className="space-y-2.5">
                <FormField label="วันที่">
                    <DatePicker value={date} onChange={setDate} clearable />
                </FormField>
                <FormField label="วันที่ เวลา">
                    <DateTimePicker value={dateTime} onChange={setDateTime} clearable />
                </FormField>
                <FormField label="ช่วงวันที่">
                    <DateRangePicker start={range.start} end={range.end} onChange={setRange} clearable />
                </FormField>
            </div>
        </Section>
    )
}

function Progress() {
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

function Overlays({ toastUrl }) {
    const [open, setOpen] = useState(null)

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
            </Row>
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

export default function UiKit({ toastUrl }) {
    return (
        <>
            <Head title="UI Kit" />
            <div className="space-y-3">
                <PageHeader title="UI Kit" description="ทุกชิ้นในชุด Tungsten ตามธีมของ panel นี้ ใช้เป็นตัวอย่างตอนสร้างหน้า" />
                <SectionGrid min="36rem">
                    <Theme />
                    <Buttons />
                    <Chips />
                    <Forms />
                </SectionGrid>
                <Tables />
                <TreeTableDemo />
                <SectionGrid min="36rem">
                    <Dates />
                    <Progress />
                </SectionGrid>
                <SectionGrid min="36rem">
                    <GroupedTable />
                    <Filtering />
                    <Lists />
                    <Containers />
                    <Navs />
                    <Overlays toastUrl={toastUrl} />
                </SectionGrid>
            </div>
        </>
    )
}

UiKit.layout = (page) => <AppLayout>{page}</AppLayout>
