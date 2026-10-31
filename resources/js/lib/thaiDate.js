/**
 * Thai Buddhist-era date helpers for the kit's date pickers. Values stay ISO and
 * Gregorian (`Y-m-d`, `Y-m-d\TH:i` — what a native date input gives and Laravel's
 * `date` rules read); only the display adds 543 to the year. No React here.
 */
export const BE_OFFSET = 543

export const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

export const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** Monday first, as Filament's ThaiDatePicker. */
export const THAI_WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

const THAI_WEEKDAYS_FULL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

const pad = (number) => String(number).padStart(2, '0')

/** @returns {{y: number, m: number, d: number, time: string|null}|null} m is 1-12 */
export function parseIso(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(value ?? '')

    return match ? { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]), time: match[4] ?? null } : null
}

/** `Y-m-d` for a day; overflowing parts roll over (day 32 → next month). */
export function dayKey(y, m, d) {
    const date = new Date(y, m - 1, d)

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export const dayOf = (value) => (value ? value.slice(0, 10) : null)

export const timeOf = (value) => parseIso(value)?.time ?? null

export const monthOf = (key) => `${key.slice(0, 7)}-01`

export function addDays(key, days) {
    const { y, m, d } = parseIso(key)

    return dayKey(y, m, d + days)
}

/** Moves by whole months, keeping the day number within the target month. */
export function addMonths(key, months) {
    const { y, m, d } = parseIso(key)
    const last = new Date(y, m - 1 + months + 1, 0).getDate()

    return dayKey(y, m + months, Math.min(d, last))
}

/** Today in the browser's local time (not UTC, which is yesterday before 07:00 in Bangkok). */
export function todayKey() {
    const now = new Date()

    return dayKey(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function nowTime() {
    const now = new Date()

    return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/** "19 ต.ค. 69" / "19 ต.ค. 69 14:02" — the panel's thaidate('j M y'). */
export function formatThaiDate(value) {
    const parts = parseIso(value)

    if (!parts) {
        return ''
    }

    const date = `${parts.d} ${THAI_MONTHS_SHORT[parts.m - 1]} ${String(parts.y + BE_OFFSET).slice(-2)}`

    return parts.time ? `${date} ${parts.time}` : date
}

/** "วันจันทร์ที่ 19 ตุลาคม 2569" — a calendar day's accessible name. */
export function formatSpokenDate(key) {
    const { y, m, d } = parseIso(key)

    return `วัน${THAI_WEEKDAYS_FULL[new Date(y, m - 1, d).getDay()]}ที่ ${d} ${THAI_MONTHS[m - 1]} ${y + BE_OFFSET}`
}

/** Keeps a value inside [min, max]; ISO strings of the same shape compare as text. */
export function clampDate(value, min, max) {
    if (min && value < min) {
        return value.length === min.length ? min : `${dayOf(min)}${value.slice(10)}`
    }

    if (max && value > max) {
        return value.length === max.length ? max : `${dayOf(max)}${value.slice(10)}`
    }

    return value
}
