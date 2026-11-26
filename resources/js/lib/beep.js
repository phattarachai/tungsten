/**
 * A short two-tone beep from WebAudio. Browsers keep sound locked until the user touches the page, so `unlockSound`
 * runs from a click or key press; a beep asked for before that stays silent instead of sounding late.
 */
let context = null

export function unlockSound() {
    try {
        const Context = window.AudioContext ?? window.webkitAudioContext

        context ??= Context ? new Context() : null

        return Promise.resolve(context?.state === 'suspended' ? context.resume() : undefined).catch(() => {})
    } catch {
        return Promise.resolve()
    }
}

export const soundReady = () => context?.state === 'running'

function tone(frequency, from, seconds) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, from)
    gain.gain.exponentialRampToValueAtTime(0.12, from + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, from + seconds)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(from)
    oscillator.stop(from + seconds)
}

export function beep() {
    if (!soundReady()) {
        return
    }

    try {
        tone(880, context.currentTime, 0.12)
        tone(1175, context.currentTime + 0.12, 0.18)
    } catch {
        // audio device gone: no sound
    }
}
