import { SquarePen, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useColumnVisibility } from '../../lib/useColumnVisibility'
import { AvatarStack, Badge, branchIds, Button, ButtonGroup, ColumnsMenu, DataList, DataTable, Filters, Pagination, Section, SelectionBar, Thumb, TreeTable } from '../ui'

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

export function Tables() {
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

export function GroupedTable() {
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
        default: 'month',
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

export function Filtering() {
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

export function Lists() {
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

export function TreeTableDemo() {
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
