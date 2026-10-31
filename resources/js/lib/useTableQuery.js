import { router, usePage } from '@inertiajs/react'

import { parseUrl, pathOf } from './browser'

/**
 * Drives a TableQuery list from the page: each setter rewrites the query string and reloads the page props with
 * state and scroll kept. Changing search, sort or a filter goes back to page 1.
 *
 *     const query = useTableQuery()
 *     <DataTable sort={table.sort} onSort={query.setSort} … />
 *     <Pagination paginator={table.pagination} onPage={query.setPage} />
 */
export function useTableQuery(options = {}) {
    const { url } = usePage()

    function visit(changes, { keepPage = false } = {}) {
        const target = parseUrl(url)

        for (const [key, value] of Object.entries(changes)) {
            target.searchParams.delete(key)
            target.searchParams.delete(`${key}[]`)

            if (Array.isArray(value)) {
                value.forEach((entry) => target.searchParams.append(`${key}[]`, entry))
            } else if (value !== null && value !== undefined && value !== '') {
                target.searchParams.set(key, value)
            }
        }

        if (!keepPage) {
            target.searchParams.delete('page')
        }

        router.get(pathOf(target), {}, { preserveState: true, preserveScroll: true, replace: true, ...options })
    }

    return {
        setSearch: (search) => visit({ search }),
        setSort: (key, dir) => visit({ sort: key, dir }),
        setPage: (page) => visit({ page: page > 1 ? page : null }, { keepPage: true }),
        setFilter: (key, value) => visit({ [key]: value }),
        setFilters: (filters) => visit(filters),
        clear: (keys) => visit(Object.fromEntries(keys.map((key) => [key, null]))),
        visit,
    }
}
