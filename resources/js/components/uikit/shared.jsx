export const swatch = (fill, label) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="${fill}"/><text x="320" y="225" font-size="44" text-anchor="middle" fill="#fff" font-family="sans-serif">${label}</text></svg>`)}`
export const GALLERY = [
    { src: swatch('#0d9488', 'สลิป'), alt: 'สลิปโอนเงิน SO-10241' },
    { src: swatch('#b45309', 'คูปอง'), alt: 'คูปองส่วนลด 10%' },
    { src: swatch('#1f57b0', 'สินค้า'), alt: 'วิตามินซี 1000 มก.' },
]

export function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 py-1.5">
            <span className="text-[0.6875rem] text-zinc-500">{label}</span>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    )
}
