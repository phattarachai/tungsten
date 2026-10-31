// A browser-like global scope for dom-check.jsx, loaded with `node --import` before React and the kit.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://tungsten.local/admin/orders' })

// Inertia's router reads the navigation type when it loads; jsdom has no performance timeline.
dom.window.performance.getEntriesByType = () => []

globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Node = dom.window.Node
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.IS_REACT_ACT_ENVIRONMENT = true
