import { router, usePage } from '@inertiajs/react'

import { parseUrl, pathOf } from './browser'

/**
 * `url` with `changes` applied: each key's old values go first in every form (`key`, `key[]`, and the indexed
 * `key[0]`, `key[1]`… Inertia writes), then arrays are appended as `key[]`; null, undefined and '' clear. Back to page
 * 1 unless `keepPage`.
 */
export function applyQuery(url, changes, { keepPage = false } = {}) {
    const target = parseUrl(url)

    for (const [key, value] of Object.entries(changes)) {
        for (const name of [...target.searchParams.keys()]) {
            if (name === key || name.startsWith(`${key}[`)) {
                target.searchParams.delete(name)
            }
        }

        if (Array.isArray(value)) {
            value.forEach((entry) => target.searchParams.append(`${key}[]`, entry))
        } else if (value !== null && value !== undefined && value !== '') {
            target.searchParams.set(key, value)
        }
    }

    if (!keepPage) {
        target.searchParams.delete('page')
    }

    return pathOf(target)
}

/**
 * Drives a TableQuery list from the page: each setter rewrites the query string and reloads the page props with
 * state and scroll kept. Changing search, sort or a filter goes back to page 1.
 *
 *     const query = useTableQuery()
 *     <DataTable sort={table.sort} onSort={query.setSort} … />
 *     <Pagination paginator={table.pagination} onPage={query.setPage} onPerPage={query.setPerPage} />
 */
export function useTableQuery(options = {}) {
    const { url } = usePage()

    function visit(changes, { keepPage = false } = {}) {
        router.get(applyQuery(url, changes, { keepPage }), {}, { preserveState: true, preserveScroll: true, replace: true, ...options })
    }

    return {
        setSearch: (search) => visit({ search }),
        setSort: (key, dir) => visit({ sort: key, dir }),
        setPage: (page) => visit({ page: page > 1 ? page : null }, { keepPage: true }),
        setPerPage: (perPage) => visit({ per_page: perPage }),
        setFilter: (key, value) => visit({ [key]: value }),
        setFilters: (filters) => visit(filters),
        clear: (keys) => visit(Object.fromEntries(keys.map((key) => [key, null]))),
        visit,
    }
}
