<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The UI Kit's toast buttons: flashes a sample of the tone the way a real save does.
 */
class UiKitToastController
{
    private const array SAMPLES = [
        'success' => 'บันทึกคำสั่งซื้อแล้ว',
        'info' => 'มีคำสั่งซื้อใหม่ 3 รายการ',
        'warning' => 'สินค้า 2 รายการใกล้หมดสต็อก',
        'error' => 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง',
    ];

    public function __invoke(Request $request): RedirectResponse
    {
        $tone = (string) $request->input('tone');

        abort_unless(isset(self::SAMPLES[$tone]), 422);

        return back()->with('flash', ['message' => self::SAMPLES[$tone], 'tone' => $tone]);
    }
}
