# Changelog

All notable changes to `phattarachai/tungsten` are documented here.

Release notes are drafted automatically from merged pull requests and published on the
[Releases page](https://github.com/phattarachai/tungsten/releases) — that page is the authoritative log.

This file records anything released before that automation landed.

## v0.1.0 — 2026-10-31

First release: the panel kernel and UI kit, extracted from an in-house Inertia + React admin.

- `Panel`, `Page`, `PanelRegistry`, `PanelProvider` and `PanelSet` (with `discoverSets()`); routes on a cache-safe
  `PageController`; numeric route parameters by default; missing page classes skipped and reported.
- The panel's own root view and Inertia middleware with shared `auth`, `panel`, `panels`, `nav`, `breadcrumbs`,
  `flash`; Inertia error pages via `Tungsten::handleExceptions()`.
- `TableQuery`: whitelisted sort, search (relations, LIKE-escaped, `ilike` opt-in), filters, pagination.
- `tungsten:install` and `make:tungsten-page`.
- The JS kit (~45 components, `AppLayout` and chrome, `createTungstenApp`, `useTableQuery`), the steel theme with a
  configurable brand colour, IBM Plex Sans Thai, Thai strings in one object, the UI Kit page.
