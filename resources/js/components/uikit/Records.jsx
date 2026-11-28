import { SquarePen } from 'lucide-react'
import { useState } from 'react'

import { Badge, Button, Card, CardHeader, DataTable, DetailList, Facts, GroupedNav, Heading, IconButton, RecordPager, Rule, Section, Sortable, StatsStrip, TabSection } from '../ui'

const preventVisit = { onClick: (event) => event.preventDefault() }

export function RecordParts() {
    return (
        <Section id="record" title="StatsStrip · Heading · Facts · Rule" hint="หน้าข้อมูล: แผ่นเดียว เส้นบางคั่น ไม่มี Section ซ้อน" flush>
            <StatsStrip
                stats={[
                    { label: 'คำสั่งซื้อทั้งหมด', value: '128', hint: 'ตั้งแต่ ม.ค. 68' },
                    { label: 'ยอดซื้อสะสม', value: '฿84,250' },
                    { label: 'แต้มคงเหลือ', value: '1,240' },
                    { label: 'ค้างชำระ', value: '2', tone: 'todo', href: '#record' },
                ]}
            />
            <div className="@container p-3">
                <Heading actions={<IconButton icon={SquarePen} label="แก้ไขข้อมูลลูกค้า" />}>ข้อมูลลูกค้า</Heading>
                <div className="grid gap-4 @2xl:grid-cols-2">
                    <Facts rows={[{ label: 'ชื่อ', value: 'เกศินี วงศ์ใหญ่' }, { label: 'เบอร์โทร', value: '081-234-5678' }, { label: 'อีเมล', value: null }]} />
                    <Facts rows={[{ label: 'กลุ่ม', value: 'สมาชิก Gold' }, { label: 'สมัครเมื่อ', value: '12 ม.ค. 68' }]} />
                </div>
                <Rule />
                <Heading>ที่อยู่จัดส่ง</Heading>
                <Facts rows={[{ label: 'ที่อยู่', value: '99/1 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110' }]} />
            </div>
        </Section>
    )
}

const REWARDS = [
    { id: 1, title: 'ร่มพับ', points: 500 },
    { id: 2, title: 'ชุดของขวัญปีใหม่ 2569 พร้อมการ์ดอวยพรและกล่องพรีเมียมสำหรับลูกค้าคนสำคัญ', points: 3200 },
    { id: 3, title: 'แก้วเก็บความเย็น', points: 900, variants: [{ id: 'c1', name: 'สีเขียว', points: 900, stock: 12 }, { id: 'c2', name: 'สีดำ', points: 950, stock: 0 }] },
    { id: 4, title: 'คูปองส่วนลด 10%', points: 300 },
]

export function Reorder() {
    const [items, setItems] = useState(REWARDS)
    const [sorting, setSorting] = useState(false)

    return (
        <Section
            id="reorder"
            title="Sortable · DataTable reorderable · wrap"
            hint="ลากที่จับ หรือกด ↑ ↓ บนที่จับ"
            actions={
                <Button size="sm" variant={sorting ? 'solid' : 'outline'} tone="amber" onClick={() => setSorting(!sorting)}>
                    {sorting ? 'เสร็จสิ้น' : 'จัดลำดับ'}
                </Button>
            }
            flush
        >
            <DataTable
                flush
                columns={[
                    { key: 'title', label: 'ของรางวัล', wrap: 'w-64', sortable: true, sub: (line) => <span className="pl-3">{line.name}</span> },
                    { key: 'points', label: 'แต้ม', align: 'right', sortable: true, sub: (line) => line.points },
                    { key: 'stock', label: 'คงเหลือ', align: 'right', render: (row) => row.variants?.reduce((sum, line) => sum + line.stock, 0) ?? '—', sub: (line) => line.stock },
                ]}
                rows={items}
                subRows={(row) => row.variants}
                reorderable={sorting ? { onReorder: setItems } : undefined}
            />
            <div className="border-t border-zinc-100 px-2.5 py-1.5">
                <Sortable items={items} onReorder={setItems} numbered renderItem={(item) => <span className="truncate">{item.title}</span>} />
            </div>
        </Section>
    )
}

export function Containers() {
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

export function Navs() {
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
