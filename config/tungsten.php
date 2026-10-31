<?php

declare(strict_types=1);

return [

    /*
    | Middleware every panel route runs behind, before the panel's own `->middleware()`, its gate (`can:`) and
    | Tungsten's Inertia middleware. Guests are redirected by `auth` to the app's login.
    */
    'middleware' => ['web', 'auth'],

    /*
    | The accent colour of every panel (primary buttons, key cells, active marks), set inline on the panel's <html>.
    | A panel overrides it with `->brandColor()`. Null leaves `--color-brand` to your stylesheet's @theme, like every
    | other token (greys, font, radius) — see the README's "Theme".
    */
    'brand_color' => env('TUNGSTEN_BRAND_COLOR', '#ba1a1a'),

    /*
    | The route name (or URL) the user menu's sign-out POSTs to; null hides it. A panel overrides it with
    | `->logoutUrl()`.
    */
    'logout_route' => 'logout',

    /*
    | A panel's own sign-in page, on for panels that call `->login()` (else the app's login, via `auth`). Its routes run
    | behind `middleware` only — not the panel's auth or gate. `labels` are the page's words and messages; a panel
    | overrides any of them with `->login(labels: [...])`. `:seconds` / `:minutes` fill in the throttle wait.
    */
    'login' => [
        'middleware' => ['web'],
        'labels' => [
            'title' => 'เข้าสู่ระบบ',
            'intro' => '',
            'email' => 'อีเมล',
            'password' => 'รหัสผ่าน',
            'remember' => 'จดจำการเข้าสู่ระบบ',
            'submit' => 'เข้าสู่ระบบ',
            'forgot' => 'ลืมรหัสผ่าน?',
            'failed' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
            'denied' => 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้ระบบนี้',
            'throttled' => 'ลองเข้าสู่ระบบหลายครั้งเกินไป ลองใหม่ในอีก :seconds วินาที',
        ],
    ],

    /*
    | How each environment shows in the panel (a line under the brand, a Badge in the compact switcher, the login page,
    | and a "Label · " tab-title prefix): env name => ['label' => …, 'tone' => a status tone], or null to show nothing.
    | These entries go over the kit's defaults: production null, local Local/active, staging Staging/done, uat
    | UAT/todo. Any other environment shows its own name in the `draft` tone.
    */
    'environments' => [],

    /*
    | The panel's tab icon: one path, or several for browsers to pick from (e.g. ['favicon.png', 'images/mark.svg'] —
    | SVG last, so browsers that can draw it use it). `apple_touch_icon` is the home-screen icon (a 180px PNG).
    */
    'favicon' => null,

    'apple_touch_icon' => null,

    /*
    | How `<Filters>` lays out a list's filters: 'bar' shows them all above the table, 'menu' puts them in a dropdown
    | with a chip per active filter. A panel overrides it with `->filterLayout()`, a page with `<Filters layout>`.
    */
    'filter_layout' => 'bar',

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
