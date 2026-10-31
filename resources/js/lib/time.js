import { strings } from './strings'

export function relative(iso, now = Date.now()) {
    if (!iso) {
        return null
    }

    const minutes = Math.round((new Date(iso).getTime() - now) / 60000)
    const size = Math.abs(minutes)
    const amount = size < 60 ? strings.minutes(size) : size < 1440 ? strings.hours(Math.round(size / 60)) : strings.days(Math.round(size / 1440))

    if (size === 0) {
        return strings.now
    }

    return minutes > 0 ? strings.inFuture(amount) : strings.inPast(amount)
}
