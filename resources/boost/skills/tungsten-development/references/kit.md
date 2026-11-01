# Tungsten kit

Everything below is exported from `@tungsten`. The UI Kit page (`UiKitPage`, routed outside production) shows each
one in its states under the panel's theme. Read the component's source in `vendor/phattarachai/tungsten/resources/js`
before relying on a prop not listed here.

## Shell

| Component | Main props |
|---|---|
| `AppLayout` | `toolbar`, `sheet`, `flush`, `width` (`'4xl'` … `'full'`), `sidebar={false}`, `topbar={false}`, `className`, `mainClassName` |
| `PageHeader` | `title`, `description`, `actions` |
| `Aside` | `open`, `title`, `actions`, `onClose`, `widthKey` — docked right panel, resizable |
| `AuditPanel`, `LastEdited` | the audit trail in the Aside, and its quiet "แก้ไข …" trigger |
| `Sidebar`, `Topbar`, `PanelSwitcher`, `FlashToast`, `TooltipLayer` | parts of `AppLayout`, for a layout of your own |
| `GlobalSearch` | `url` — the topbar search box (shown by `Topbar` when the panel has searches) |
| `NotificationBell` | `url`, `poll` — the topbar bell (shown by `Topbar` when the panel has `notifications()`) |

## Lists

| Component | Main props |
|---|---|
| `DataTable` | `columns` (`key`, `label`, `render`, `sub`, `align`, `valign`, `sortable`, `sortDir`, `primary`, `truncate`, `wrap`, `sticky`, `className`), `rows`, `rowKey`, `rowHref`, `plainLinks`, `rowActions`, `sort` + `onSort`, `selection` + `onSelectionChange`, `groups`, `subRows`, `reorderable`, `flush`, `empty` |
| `Filters` | `filters` (`key`, `label`, `type`: `select`/`buttons`/`pills`/`toggle`/`dates`/`custom`, `options`, `multiple`, `default` (a `dates` default sends `all` for ทั้งหมด), `row`, `chip`), `values`, `onChange`, `search`, `start`, `layout` (`bar`/`menu`), `flush` |
| `FilterBar`, `FilterField`, `FilterMenu`, `FilterChip` | the parts of `Filters`, for a layout of your own |
| `Pagination` | `paginator`, `onPage`, `onPerPage`, `perPageOptions`, `flush` |
| `TableToolbar` | `start`, children (right), `flush` |
| `SearchInput` | `value`, `onSearch` (debounced) or `onChange`, `placeholder`, `size` |
| `Pills` | `options` (`value`, `label`, `count`, `tone`), `value`, `onChange` — count tabs |
| `ColumnsMenu` + `useColumnVisibility` | show / hide columns, remembered per browser |
| `SelectionBar` | `count`, `onClear`, children (bulk actions) |
| `DataList` | `rows`, `lead`, `title`, `subtitle`, `meta`, `columns`, `actions` — 2–3 line rows instead of a wide table |
| `TreeTable` | `columns`, `nodes`, `collapsed`, `onToggle` |
| `StatsStrip` | `stats` (`label`, `value`, `hint`, `tone`, `href`) |
| `Sortable`, `SortHandle`, `useSortable` | reorder by drag (mouse, pen, touch) or ↑ / ↓ |

## Records

| Component | Main props |
|---|---|
| `Heading`, `Rule`, `Facts` | the record page's plain parts: a heading with `actions`, the hairline, label–value rows |
| `DetailList` | label–value rows with dividers, for inside a `Section` |
| `Section`, `SectionGrid`, `SectionStack`, `Card` | boxed sections (dashboards, settings); not for record pages |
| `TabSection` | `tabs` (`key`, `label`, `count`, `content`, `actions`), `value` + `onChange` or `storageKey`, `flush` |
| `RecordLayout` | `title`, `subtitle`, `tabs`, `meta`, `actions`, `pager`, `width` |
| `RecordPager` | `previousUrl`, `nextUrl` |
| `GroupedNav`, `NavList` | side navs (grouped boxes / a plain list) |
| `Stepper` | `steps` (`label`, `state`, `tone`, lines) |
| `Timeline`, `TimelineEvent`, `TimelineHead`, `TimelineDivider` | an event history |

## Forms

| Component | Main props |
|---|---|
| `FormField` | `label`, `error`, `hint`, `info` (ⓘ tooltip), `stacked`, `htmlFor` |
| `Input`, `Textarea`, `Select` (`size="sm"`) | native props; a width class replaces their full width |
| `Combobox` | `options` (`value`, `label`, `meta`, `avatar`), `value`, `onChange`, `multiple`, `clearable`, `size`, `label`, `onSearch` |
| `RadioGroup` | `options` (`value`, `label`, `description`, `disabled`), `value`, `onChange`, `layout` (`list`/`cards`/`inline`), `invalid` |
| `Checkbox` | `checked`, `onChange(checked)`, `label`, `hint`, `error`, `indeterminate` |
| `Switch` | `checked`, `onChange`, `label` |
| `DatePicker`, `DateTimePicker`, `DateRangePicker` | ISO values, shown in พ.ศ.; `clearable`, `min`, `max` |
| `RichText` (from `@tungsten/rich-text`) | `value` / `onChange` (HTML), `onUploadImage`, `headings`, `placeholder`, `invalid` — needs the `@tiptap/*` packages |
| `RichTextView` | `html` — stored rich text, read-only |
| `PickerDialog` | `open`, `title`, `options` or `url` (+ `queryKey`), `counts` (×qty), `onPick`, `onClose`, `error` — picture-card picker |
| `FormDialog` | `title`, `processing`, `onSubmit`, `onClose`, `submitLabel` — doesn't close on click-away |
| `ConfirmDialog` | `open`, `title`, `tone`, `onConfirm` (none = an info box), `onClose` |
| `Dialog` | `open`, `onClose`, `title`, `footer`, `dismissible` |

## Actions and marks

| Component | Main props |
|---|---|
| `Button` | `variant` (`solid`/`outline`/`ghost`), `tone` (`neutral`/`brand`/`amber`/`blue`/`danger`), `size`, `icon` |
| `IconButton` | `icon`, `label` (tooltip), `tone` |
| `CopyButton` | `value`, `label`, `copiedLabel` — copies to the clipboard, a tick for a moment |
| `ActionMenu`, `RowActions` | `items` (`label`, `icon`, `href` or `onSelect`, `tone: 'danger'`) |
| `ButtonGroup` | segmented choice; `size="sm"` in toolbars |
| `ButtonBar`, `SyncButton`, `HelpLink` | grouped buttons, a "pull from another system" button, a handbook link |
| `Badge` | `tone`: status (`draft` `waiting` `todo` `active` `done` `canceled` `failed`) or colour (`zinc` `brand` `green` `amber` `red` `blue`) |
| `Avatar`, `AvatarStack` | `person` (`avatar`, `name`), `zoom`; overlapping avatars with +N |
| `Thumb` | `src`, `full`, `alt`, `zoom` — a rounded image with a placeholder |
| `Zoomable`, `LightboxProvider`, `useLightbox` | full-screen images |
| `Chart` | `data` (`[{ label, value }]`), `type` (`bar`/`line`), `tone`, `height`, `format`, `unit`, `empty`, `label` — a small SSR-safe series chart |
| `Dropdown`, `DropdownSection`, `DropdownOption` | a popover menu |
| `Icon`, `registerIcons` | named lucide icons (`registerIcons({ name: Component })` adds more) |

## Helpers

`useTableQuery` (`setSearch`, `setSort`, `setPage`, `setPerPage`, `setFilter`, `setFilters`, `clear`),
`applyQuery`, `useQueryState`, `useCarriedQuery`, `withQuery`, `usePersistentState`, `sendJson` / `getJson` /
`postJson`, `linkProps` / `urlOf` / `methodOf` (every href prop takes a string or `{url, method}`), `cn`, `number`,
`relative`, `formatThaiDate`, `todayKey`, `setStrings` / `strings`, `createTungstenApp`, `tungstenResolver`.
