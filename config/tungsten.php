<?php

declare(strict_types=1);

return [

    /*
    | Middleware every panel route runs behind, before the panel's own `->middleware()`, its gate (`can:`) and
    | Tungsten's Inertia middleware. Guests are redirected by `auth` to the app's login.
    */
    'middleware' => ['web', 'auth'],

    /*
    | The accent colour of every panel (primary buttons, key cells, active marks). A panel overrides it with
    | `->brandColor()`. The rest of the theme is the kit's steel greys.
    */
    'brand_color' => env('TUNGSTEN_BRAND_COLOR', '#ba1a1a'),

    /*
    | The route name (or URL) the user menu's sign-out POSTs to; null hides it. A panel overrides it with
    | `->logoutUrl()`.
    */
    'logout_route' => 'logout',

    'favicon' => null,

    /*
    | The panel's root Blade view loads this Vite entry (the one `tungsten:install` writes), and modulepreloads the
    | current page's chunk from `pages`. Page components are named relative to `pages`, e.g. `panel/orders/Index`.
    */
    'vite' => [
        'entry' => 'resources/js/tungsten.jsx',
        'pages' => 'resources/js/pages',
        'build_directory' => 'build',
    ],

    /*
    | Where `make:tungsten-page` writes: page classes under `app_path(classes)`, JSX under `vite.pages/components`.
    */
    'generator' => [
        'classes' => 'Panel/Pages',
        'namespace' => 'App\\Panel\\Pages',
        'components' => 'panel',
    ],

    /*
    | Error pages (403/404/419/500/503) under a panel path render as the panel's Inertia error page once the app
    | calls `Tungsten::handleExceptions($exceptions)` in bootstrap/app.php. A 500 keeps Laravel's stack trace while
    | `app.debug` is on.
    */
    'error_statuses' => [403, 404, 419, 500, 503],

    /*
    | inertia-laravel 3 records every request (full props) to storage/inertia-devtools in `local` when
    | INERTIA_DEVTOOLS_ENABLED is unset — ~100 ms a request and hundreds of MB in days. Tungsten turns it off in
    | that case; set INERTIA_DEVTOOLS_ENABLED=true while you use the browser extension.
    */
    'disable_inertia_devtools' => true,

];
