/**
 * Every user-visible string the kit draws, in one place. Thai is the default; a host adds
 * another language (or rewords one) with `setStrings({...})` before the app mounts.
 * Components read `strings.x` at render time, so an override applies everywhere.
 */
export const strings = {
    close: 'ปิด',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    confirm: 'ยืนยัน',
    clear: 'ล้าง',
    clearValue: 'ล้างค่า',
    noData: 'ไม่มีข้อมูล',
    noItems: 'ไม่มีรายการ',
    noEvents: 'ไม่มีเหตุการณ์',
    noOptions: 'ไม่พบตัวเลือก',
    items: 'รายการ',
    selected: (count, unit) => `เลือก ${count} ${unit}`,
    selectAll: 'เลือกทั้งหมด',
    selectRow: 'เลือกแถวนี้',
    inactive: 'ปิดการใช้งาน',
    previous: 'ก่อนหน้า',
    next: 'ถัดไป',
    recordPager: 'เลื่อนรายการ',
    expand: 'ขยาย',
    collapse: 'ย่อ',
    search: 'ค้นหา…',
    choose: 'เลือก…',
    all: 'ทั้งหมด',
    actions: 'การทำงาน',
    actionsFor: (title) => `การทำงาน ${title}`,
    columns: 'คอลัมน์',
    toggleColumns: 'แสดง / ซ่อนคอลัมน์',
    resetColumns: 'คืนค่าเริ่มต้น',
    paginationRange: (from, to, total) => `${from}–${to} จาก ${total}`,
    previousPage: 'หน้าก่อน',
    nextPage: 'หน้าถัดไป',
    perPage: (count) => `${count} / หน้า`,
    rowsPerPage: 'จำนวนต่อหน้า',

    // Date pickers (the calendar's month and weekday names live in lib/thaiDate.js)
    pick: 'เลือก',
    pickDate: 'เลือกวันที่',
    pickDateTime: 'เลือกวันที่ เวลา',
    pickNamed: (label) => `เลือก${label}`,
    openCalendar: 'เปิดปฏิทิน',
    previousMonth: 'เดือนก่อนหน้า',
    nextMonth: 'เดือนถัดไป',
    month: 'เดือน',
    yearBE: 'ปี พ.ศ.',
    time: 'เวลา',
    hour: 'ชั่วโมง',
    minute: 'นาที',
    now: 'ตอนนี้',
    today: 'วันนี้',
    dateRange: 'ช่วงวันที่',
    start: 'เริ่ม',
    end: 'สิ้นสุด',
    startDate: 'วันเริ่ม',
    endDate: 'วันสิ้นสุด',
    pickStartDate: 'เลือกวันเริ่ม',
    pickEndDate: 'เลือกวันสิ้นสุด',

    // Relative time (lib/time.js)
    minutes: (n) => `${n} นาที`,
    hours: (n) => `${n} ชม.`,
    days: (n) => `${n} วัน`,
    inFuture: (amount) => `อีก ${amount}`,
    inPast: (amount) => `${amount}ที่แล้ว`,

    // Chrome
    toggleSidebar: 'ย่อ / ขยายเมนู',
    signOut: 'ออกจากระบบ',
    help: 'คู่มือ',
    helpForPage: 'คู่มือของหน้านี้',
    readHelp: 'อ่านในคู่มือ',
    openFull: 'เปิดเต็มหน้า',
    resizeHelp: 'ปรับความกว้างคู่มือ',
    resize: (title) => `ปรับความกว้าง ${title}`,
    legacyLink: (label) => `${label} ในระบบเดิม`,
    emptyPanel: 'ยังไม่มีหน้าใน panel นี้',

    // Audit history
    history: 'ประวัติ',
    editHistory: 'ประวัติการแก้ไข',
    editedAt: (at) => `แก้ไข ${at}`,
    lastEditedBy: (name) => `แก้ไขล่าสุดโดย ${name} · ดูประวัติ`,
    historyFailed: 'โหลดประวัติไม่สำเร็จ',
    historyEmpty: 'ยังไม่มีประวัติการแก้ไข',

    // Error page
    errors: {
        403: { title: 'ไม่มีสิทธิ์เข้าหน้านี้', body: 'บัญชีนี้ไม่มีสิทธิ์เปิดหน้านี้' },
        404: { title: 'ไม่พบหน้านี้', body: 'หน้าที่เปิดอาจถูกย้ายหรือลบไปแล้ว' },
        419: { title: 'หน้าหมดอายุ', body: 'โหลดหน้าใหม่แล้วลองอีกครั้ง' },
        500: { title: 'ระบบขัดข้อง', body: 'เกิดข้อผิดพลาดฝั่งระบบ ลองใหม่อีกครั้ง' },
        503: { title: 'ปิดปรับปรุงชั่วคราว', body: 'ระบบกำลังปรับปรุง ลองใหม่อีกครั้งในอีกสักครู่' },
    },
    backHome: 'กลับหน้าหลัก',
}

export function setStrings(overrides) {
    Object.assign(strings, overrides)
}
