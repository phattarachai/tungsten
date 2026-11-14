<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Notifications\PanelResetPasswordNotification;
use Phattarachai\Tungsten\Tests\Fixtures\Models\User;
use Phattarachai\Tungsten\Tungsten;

function resetUser(array $attributes = []): User
{
    return User::query()->create(['name' => 'Somchai', 'email' => 'somchai@example.com', 'password' => 'old-password', ...$attributes]);
}

/**
 * Asks for a link and returns the token the mail carries.
 */
function mailedToken(User $user): string
{
    $token = null;

    Notification::assertSentTo($user, PanelResetPasswordNotification::class, function (PanelResetPasswordNotification $notification) use (&$token): bool {
        preg_match('#/staff/reset-password/([^?]+)\?email=#', $notification->url, $matches);
        $token = $matches[1] ?? null;

        return $token !== null;
    });

    return (string) $token;
}

beforeEach(function (): void {
    Notification::fake();
    RateLimiter::clear('tungsten-password-forgot|127.0.0.1');
    RateLimiter::clear('tungsten-password-reset|127.0.0.1');
});

it('links the panel login to its own forgot-password page', function (): void {
    $this->get('/staff/login')->assertInertia(fn (Assert $page): Assert => $page->where('forgotPasswordUrl', url('/staff/forgot-password')));

    $this->get('/staff/forgot-password')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::auth/ForgotPassword', shouldExist: false)
            ->where('labels.forgotTitle', 'ลืมรหัสผ่าน')
            ->where('action', url('/staff/forgot-password'))
            ->where('loginUrl', url('/staff/login')));
});

it('mails the panel\'s Thai reset link, and answers the same for an email with no account', function (): void {
    $user = resetUser();

    $this->from('/staff/forgot-password')->post('/staff/forgot-password', ['email' => ' Somchai@Example.com '])
        ->assertRedirect('/staff/forgot-password')
        ->assertSessionHas('status', 'ถ้าอีเมลนี้มีบัญชีอยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว กรุณาตรวจสอบอีเมล');

    Notification::assertSentTo($user, PanelResetPasswordNotification::class, function (PanelResetPasswordNotification $notification) use ($user): bool {
        $mail = $notification->toMail($user);

        return str_starts_with($notification->url, url('/staff/reset-password/'))
            && str_contains($notification->url, 'email=somchai%40example.com')
            && $mail->subject === 'ตั้งรหัสผ่านใหม่'
            && $mail->greeting === 'สวัสดีคุณ Somchai'
            && $mail->actionUrl === $notification->url
            && in_array('ลิงก์นี้ใช้ได้ 60 นาที และใช้ได้ครั้งเดียว', $mail->outroLines, true);
    });

    $this->post('/staff/forgot-password', ['email' => 'nobody@example.com'])
        ->assertSessionHas('status', 'ถ้าอีเมลนี้มีบัญชีอยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว กรุณาตรวจสอบอีเมล');

    Notification::assertSentTimes(PanelResetPasswordNotification::class, 1);
});

it('shows the reset page with the token and email from the link', function (): void {
    $this->get('/staff/reset-password/abc123?email=somchai%40example.com')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::auth/ResetPassword', shouldExist: false)
            ->where('token', 'abc123')
            ->where('email', 'somchai@example.com')
            ->where('action', url('/staff/reset-password')));
});

it('sets the new password once per link and sends the user to sign in', function (): void {
    $user = resetUser();
    $this->post('/staff/forgot-password', ['email' => 'somchai@example.com']);
    $token = mailedToken($user);
    $form = ['token' => $token, 'email' => 'somchai@example.com', 'password' => 'brand-new-password', 'password_confirmation' => 'brand-new-password'];

    $this->post('/staff/reset-password', $form)
        ->assertRedirect(url('/staff/login'))
        ->assertSessionHas('status', 'ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย');

    expect(Hash::check('brand-new-password', $user->fresh()->password))->toBeTrue();
    $this->assertGuest();

    $this->post('/staff/reset-password', [...$form, 'password' => 'another-password-1', 'password_confirmation' => 'another-password-1'])
        ->assertSessionHasErrors(['email' => 'ลิงก์นี้หมดอายุหรือใช้ไปแล้ว ขอลิงก์ใหม่ได้ที่หน้าลืมรหัสผ่าน']);

    expect(Hash::check('brand-new-password', $user->fresh()->password))->toBeTrue();
});

it('holds the new password to Password::defaults()', function (): void {
    PasswordRule::defaults(fn (): PasswordRule => PasswordRule::min(12));
    $user = resetUser();
    $this->post('/staff/forgot-password', ['email' => 'somchai@example.com']);

    $this->post('/staff/reset-password', ['token' => mailedToken($user), 'email' => 'somchai@example.com', 'password' => 'short-pw', 'password_confirmation' => 'short-pw'])
        ->assertSessionHasErrors('password');

    expect(Hash::check('old-password', $user->fresh()->password))->toBeTrue();
})->after(fn () => PasswordRule::defaults(fn (): PasswordRule => PasswordRule::min(8)));

it('throttles the forgot form per IP', function (): void {
    resetUser();

    foreach (range(1, 5) as $attempt) {
        $this->post('/staff/forgot-password', ['email' => "guess{$attempt}@example.com"])->assertSessionHasNoErrors();
    }

    $this->post('/staff/forgot-password', ['email' => 'somchai@example.com'])->assertSessionHasErrors('email');

    expect(session('errors')->first('email'))->toStartWith('ขอหลายครั้งเกินไป');
    Notification::assertNothingSent();
});

it('throttles wrong reset tokens per IP', function (): void {
    resetUser();

    foreach (range(1, 5) as $attempt) {
        $this->post('/staff/reset-password', ['token' => "guess-{$attempt}", 'email' => 'somchai@example.com', 'password' => 'brand-new-password', 'password_confirmation' => 'brand-new-password']);
    }

    $this->post('/staff/reset-password', ['token' => 'guess-6', 'email' => 'somchai@example.com', 'password' => 'brand-new-password', 'password_confirmation' => 'brand-new-password'])
        ->assertSessionHasErrors('email');

    expect(session('errors')->first('email'))->toStartWith('ขอหลายครั้งเกินไป');
});

it('lets an admin send a staff member the reset link, throttled by the broker', function (): void {
    $user = resetUser();

    expect(Tungsten::sendPasswordResetLink($user, 'staff'))->toBe(Password::RESET_LINK_SENT)
        ->and(Tungsten::sendPasswordResetLink($user, 'staff'))->toBe(Password::RESET_THROTTLED);

    Notification::assertSentToTimes($user, PanelResetPasswordNotification::class, 1);
});

it('refuses the helper on a panel without password reset', function (): void {
    Tungsten::sendPasswordResetLink(resetUser(), 'admin');
})->throws(LogicException::class, 'Panel [admin] has no password reset');

it('leaves a panel without passwordReset as it was', function (): void {
    $this->get('/admin/forgot-password')->assertNotFound();
    $this->get('/admin/login')->assertInertia(fn (Assert $page): Assert => $page->where('forgotPasswordUrl', url('/forgot-password')));
    $this->get('/tools/login')->assertNotFound();
});
