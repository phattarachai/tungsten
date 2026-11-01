import { createContext, use } from 'react'

/** The page's `width` from AppLayout (`'full'` outside it), so a DataTable on a `fit` page can drop its spacer. */
export const PageWidthContext = createContext('full')

export function usePageWidth() {
    return use(PageWidthContext)
}
