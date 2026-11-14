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
    | behind `middleware` only — not the panel's auth or gate. `labels` are the words and messages of the login, password
    | reset and two-factor pages and the reset mail; a panel overrides any of them with `->login(labels: [...])`.
    | `:seconds` / `:minutes` fill in a throttle wait.
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

            // ->login(passwordReset: true)
            'forgotTitle' => 'ลืมรหัสผ่าน',
            'forgotIntro' => 'กรอกอีเมลของบัญชี เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้',
            'sendLink' => 'ส่งลิงก์ตั้งรหัสผ่านใหม่',
            'linkSent' => 'ถ้าอีเมลนี้มีบัญชีอยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว กรุณาตรวจสอบอีเมล',
            'backToLogin' => 'กลับไปหน้าเข้าสู่ระบบ',
            'resetTitle' => 'ตั้งรหัสผ่านใหม่',
            'newPassword' => 'รหัสผ่านใหม่',
            'confirmPassword' => 'ยืนยันรหัสผ่านใหม่',
            'resetSubmit' => 'บันทึกรหัสผ่านใหม่',
            'passwordReset' => 'ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย',
            'resetInvalid' => 'ลิงก์นี้หมดอายุหรือใช้ไปแล้ว ขอลิงก์ใหม่ได้ที่หน้าลืมรหัสผ่าน',
            'resetThrottled' => 'ขอหลายครั้งเกินไป ลองใหม่ในอีก :seconds วินาที',
            'mailSubject' => 'ตั้งรหัสผ่านใหม่',
            'mailGreeting' => 'สวัสดีคุณ :name',
            'mailIntro' => 'เราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณใน :app',
            'mailAction' => 'ตั้งรหัสผ่านใหม่',
            'mailExpire' => 'ลิงก์นี้ใช้ได้ :count นาที และใช้ได้ครั้งเดียว',
            'mailIgnore' => 'ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ',

            // ->login(twoFactor: ...)
            'challengeTitle' => 'ยืนยันตัวตนสองขั้นตอน',
            'challengeIntro' => 'กรอกรหัส 6 หลักจากแอป Authenticator ในโทรศัพท์ของคุณ',
            'recoveryIntro' => 'กรอกรหัสสำรองหนึ่งชุด แต่ละชุดใช้ได้ครั้งเดียว',
            'code' => 'รหัส 6 หลัก',
            'recoveryCode' => 'รหัสสำรอง',
            'useRecoveryCode' => 'ใช้รหัสสำรองแทน',
            'useCode' => 'ใช้รหัสจากแอปแทน',
            'verify' => 'ยืนยัน',
            'invalidCode' => 'รหัสไม่ถูกต้อง',
            'invalidRecoveryCode' => 'รหัสสำรองไม่ถูกต้องหรือใช้ไปแล้ว',
            'challengeExpired' => 'หมดเวลายืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง',
            'challengeThrottled' => 'ลองหลายครั้งเกินไป ลองใหม่ในอีก :seconds วินาที',
            'setupTitle' => 'ตั้งค่ายืนยันตัวตนสองขั้นตอน',
            'setupIntro' => 'บัญชีนี้ต้องยืนยันตัวตนสองขั้นตอนก่อนเข้าใช้ระบบ ตั้งค่าครั้งเดียว ใช้เวลาไม่ถึงนาที',
            'setupRenewIntro' => 'สแกน QR ใหม่ด้วยแอป Authenticator แล้วกรอกรหัสเพื่อยืนยัน รหัสจากแอปเดิมจะใช้ไม่ได้อีก',
            'setupScan' => 'สแกน QR นี้ด้วยแอป Authenticator เช่น Google Authenticator หรือ Microsoft Authenticator',
            'setupManual' => 'สแกนไม่ได้? กรอกคีย์นี้ในแอปแทน',
            'setupConfirm' => 'กรอกรหัส 6 หลักที่แอปแสดง เพื่อยืนยันว่าตั้งค่าถูกต้อง',
            'setupSubmit' => 'ยืนยันและเปิดใช้',
            'recoveryCodesTitle' => 'เก็บรหัสสำรองไว้',
            'recoveryCodesIntro' => 'ถ้าโทรศัพท์หาย ใช้รหัสเหล่านี้เข้าสู่ระบบแทนได้ รหัสละครั้ง เก็บไว้ในที่ปลอดภัย ระบบจะไม่แสดงรหัสชุดนี้อีก',
            'copyCodes' => 'คัดลอกรหัส',
            'continue' => 'ไปต่อ',
            'logout' => 'ออกจากระบบ',
            'cancel' => 'ยกเลิก',
            'twoFactorRequired' => 'ต้องยืนยันตัวตนสองขั้นตอนก่อนใช้งานส่วนนี้',
            'setupNeedsPassword' => 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านอีกครั้ง ก่อนตั้งค่าการยืนยันตัวตนสองขั้นตอน',
        ],

        /*
        | Authenticator-app (TOTP) sign-in, on for panels that call `->login(twoFactor: ...)`. `issuer` is the name the
        | app lists the account under (null: `app.name`); `window` is how many 30-second steps either side still pass.
        */
        'two_factor' => [
            'issuer' => null,
            'recovery_codes' => 8,
            'window' => 1,
            'challenge_minutes' => 10,   // how long a correct password waits for its code before signing in again
        ],
    ],

    /*
    | A panel's own profile page, on for panels that call `->profile()`. A panel overrides any label with
    | `->profile(labels: [...])`.
    */
    'profile' => [
        'avatar_max' => 2048,   // the largest photo the profile form accepts, in KB
        'labels' => [
            'title' => 'โปรไฟล์',
            'details' => 'ข้อมูลส่วนตัว',
            'name' => 'ชื่อ',
            'email' => 'อีเมล',
            'emailLocked' => 'เปลี่ยนอีเมลเองไม่ได้ ติดต่อผู้ดูแลระบบ',
            'avatar' => 'รูปโปรไฟล์',
            'changeAvatar' => 'เปลี่ยนรูป',
            'removeAvatar' => 'ลบรูป',
            'save' => 'บันทึก',
            'saved' => 'บันทึกโปรไฟล์แล้ว',
            'password' => 'เปลี่ยนรหัสผ่าน',
            'currentPassword' => 'รหัสผ่านปัจจุบัน',
            'newPassword' => 'รหัสผ่านใหม่',
            'confirmPassword' => 'ยืนยันรหัสผ่านใหม่',
            'savePassword' => 'เปลี่ยนรหัสผ่าน',
            'passwordSaved' => 'เปลี่ยนรหัสผ่านแล้ว',

            // with ->login(twoFactor: ...)
            'twoFactor' => 'ยืนยันตัวตนสองขั้นตอน',
            'twoFactorEnabled' => 'เปิดใช้อยู่',
            'twoFactorNotEnabled' => 'ยังไม่เปิด',
            'twoFactorOn' => 'ใช้รหัสจากแอป Authenticator ทุกครั้งที่เข้าสู่ระบบ',
            'twoFactorOff' => 'เปิดใช้เพื่อให้บัญชีปลอดภัยขึ้น',
            'twoFactorRequiredNote' => 'บัญชีนี้ต้องเปิดใช้ ปิดไม่ได้',
            'recoveryCodesLeft' => 'เหลือรหัสสำรอง :count ชุด',
            'enableTwoFactor' => 'เปิดใช้',
            'renewTwoFactor' => 'เปลี่ยนโทรศัพท์',
            'regenerateCodes' => 'สร้างรหัสสำรองใหม่',
            'codesRegenerated' => 'สร้างรหัสสำรองชุดใหม่แล้ว ชุดเดิมใช้ไม่ได้อีก',
            'newRecoveryCodes' => 'รหัสสำรองชุดใหม่',
            'copyCodes' => 'คัดลอกรหัส',
            'disableTwoFactor' => 'ปิดการใช้',
            'disableConfirm' => 'ยืนยันด้วยรหัสผ่านปัจจุบันเพื่อปิดการยืนยันตัวตนสองขั้นตอน',
            'twoFactorDisabled' => 'ปิดการยืนยันตัวตนสองขั้นตอนแล้ว',
            'cancel' => 'ยกเลิก',
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
