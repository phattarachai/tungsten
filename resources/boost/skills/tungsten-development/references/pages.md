# Tungsten page recipes

Pages live in the panel pages directory (`config('tungsten.vite.pages')`, usually `resources/js/pages/panel`), one
folder per set: `panel/orders/Index.jsx`, `panel/orders/Show.jsx`. Page-specific parts go in
`resources/js/components/<set>/`. Every page sets the shell as its layout:

```jsx
import { AppLayout } from '@tungsten'

export default function Index(props) { … }

Index.layout = (page) => <AppLayout>{page}</AppLayout>
```

`AppLayout` reads `->layout()` / `->width()` metadata from the route; JSX props win (`<AppLayout width="4xl">`).

## List page

```jsx
import { Head } from '@inertiajs/react'
import { AppLayout, Badge, DataTable, Filters, PageHeader, Pagination, useTableQuery } from '@tungsten'

const COLUMNS = [
    { key: 'number', label: 'เลขที่', primary: true, sortable: true },
    { key: 'customer', label: 'ลูกค้า', wrap: 'w-64' },
    { key: 'status', label: 'สถานะ', render: (row) => <Badge tone={row.status.tone}>{row.status.label}</Badge> },
    { key: 'total', label: 'ยอดเงิน', align: 'right', sortable: true, sortDir: 'desc' },
]

export default function Index({ orders, options }) {
    const query = useTableQuery()
    const filters = [
        { key: 'date', label: 'วันที่สั่ง', type: 'dates', options: options.datePresets },
        { key: 'type', label: 'ประเภท', type: 'select', multiple: true, options: options.types },
        { key: 'status', label: 'สถานะ', type: 'select', options: options.statuses },
    ]

    return (
        <>
            <Head title="คำสั่งซื้อ" />
            <PageHeader title="คำสั่งซื้อ" actions={/* primary create button */ null} />
            <Filters flush filters={filters} values={orders.filters} onChange={query.setFilters} search={{ value: orders.search, placeholder: 'ค้นหาเลขที่ ชื่อ เบอร์โทร' }} />
            <DataTable flush columns={COLUMNS} rows={orders.rows} sort={orders.sort} onSort={query.setSort} rowHref={(row) => row.url} rowActions={(row) => row.actions} />
            <Pagination flush paginator={orders.pagination} onPage={query.setPage} onPerPage={query.setPerPage} />
        </>
    )
}
```

- **Filters**: one definition, drawn per the project's `filter_layout` — `bar` (presets on top; search first in row 2,
  then the filters, a clear-all icon) or `menu` (chips + a dropdown). Use `Filters`, never hand-built filter rows.
- **Search** is debounced server-side (`useTableQuery`); never a form waiting for Enter.
- **Sorting** is the column headers (`sortable`, `sortDir: 'desc'` for counts and money), not a menu.
- **Row actions** are `rowActions(row)` items `{ label, icon, href | onSelect, tone: 'danger' }`: one shows as an
  icon, several go in ⋯, destructive ones always in ⋯ and confirmed. The key cell runs the first action when the row
  has no `rowHref`.
- **Long text** in a cell: the column's `wrap` (two lines at a width, full text in the tooltip). Cells are
  `whitespace-nowrap` otherwise, and `cn` is a plain join, so a `whitespace-normal` class on the column loses.
- **Bulk actions**: `DataTable selection` + `onSelectionChange` and a `SelectionBar` while something is selected.
- **Stats above a list**: `StatsStrip` (values, an optional hint, a tone, a link).
- **Width**: a list with few columns (three to five short ones) takes `->width('fit')` on its route, so the sheet's
  content and the table shrink to the table's natural width; a column's `w-full` (a spacer) is dropped there. A wide
  list stays `full`. `DataTable fit` does the same for one table on a full-width page.
- **Many columns** that would scroll sideways: `DataList` (2–3 line rows) is the alternative; the page picks one.

## Record (detail) page

One sheet; no `Section` inside a `Section`; plain-text headings with a hairline between blocks; layout by container
width (`@container`, `@4xl:` main + summary, `@2xl:` side-by-side facts), never viewport breakpoints, so the `Aside`
doesn't squeeze it.

```jsx
<PageHeader title={order.number} actions={<>{/* main actions with labels, an ActionMenu ⋯ for rare ones */}<RecordPager previousUrl={…} nextUrl={…} /></>} />
<Stepper steps={order.steps} className="mx-auto max-w-4xl" />
<div className="@container">
    <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
            <Heading actions={<IconButton icon={FilePen} label="แก้ไขข้อมูลลูกค้า" onClick={edit} />}>ลูกค้า</Heading>
            <div className="grid gap-4 @2xl:grid-cols-2">
                <Facts rows={[{ label: 'ชื่อ', value: order.customer.name }, order.phone && { label: 'เบอร์โทร', value: order.phone }]} />
                <Facts rows={[{ label: 'ช่องทาง', value: order.channel }]} />
            </div>
            <Rule />
            <Heading>รายการสินค้า</Heading>
            <DataTable flush columns={LINE_COLUMNS} rows={order.lines} />
        </div>
        <aside className="rounded-lg border border-zinc-200 p-3">{/* money, payment, points, staff */}</aside>
    </div>
</div>
```

- **Header actions**: only main actions get a text label; editing the header is an `IconButton` with a tooltip;
  rare or destructive actions go in the ⋯ `ActionMenu`; `RecordPager` (‹ ›) goes last, alone.
- **Side information** (history, logs, audit) opens in the kit `Aside` from an `IconButton`, loaded lazily
  (`router.reload({ only: [...] })`), never a modal over the page.
- **Single values** are edited with a pencil `IconButton` beside the value that opens a `FormDialog`.
- **Adding products / rewards** to a record: `PickerDialog` (picture cards, a click adds one, ×qty), never a dropdown.
- **Inline editing** of lines stays hidden behind an "แก้ไขรายการ" toggle.
- **A record's tables** (lines, history, logs) can be tabs of one `TabSection flush` instead of sections down the page.

## Form or dialog

```jsx
const form = useForm({ name: customer.name, phone: customer.phone, keep: 'a', confirmed: false })

<FormDialog title="แก้ไขข้อมูลลูกค้า" processing={form.processing} onClose={close} onSubmit={() => form.put(customer.updateUrl, { onSuccess: close })}>
    <FormField label="ชื่อ" error={form.errors.name}><Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></FormField>
    <FormField label="เบอร์โทร" info="ใช้ส่ง SMS แจ้งสถานะ" error={form.errors.phone}><Input className="w-48" … /></FormField>
    <FormField label="เก็บข้อมูลของ"><RadioGroup options={…} value={form.data.keep} onChange={(v) => form.setData('keep', v)} /></FormField>
    <Checkbox checked={form.data.confirmed} onChange={(v) => form.setData('confirmed', v)} label="ยืนยัน" error={form.errors.confirmed} />
</FormDialog>
```

- Labels inline (left) by default; `stacked` only for wide fields.
- Help text is `FormField info` (an ⓘ tooltip), not a sentence under the field; `hint` is a few words at most.
- A field's error shows on the field (red), from the FormRequest's errors.
- More than ~10 options: `Combobox` (searchable, `multiple`); otherwise `Select`.
- A width class on a field (`w-48`) replaces its full width.
- Confirm destructive actions with `ConfirmDialog tone="danger"`; never `window.confirm`.
- A short form page: `->width('4xl')` on its route; a short list: `->width('fit')`.

## Reorder mode

Behind a "จัดลำดับ" toggle, turn paging and search off and pass every row:

```jsx
<DataTable columns={columns} rows={reordering ? all : page.rows} reorderable={reordering ? { onReorder: (rows) => router.post(reorderUrl, { ids: rows.map((row) => row.id) }, { preserveScroll: true }) } : undefined} />
```

The server takes every id once and writes `sort_order` 0…n in one transaction. `Sortable` does the same for a plain list.

## JSON calls

For what isn't an Inertia visit (a dialog's search, a quick lookup), use `sendJson` / `getJson` / `postJson`: they
send the XSRF cookie and turn a 422 into `{ field: message }` errors.
