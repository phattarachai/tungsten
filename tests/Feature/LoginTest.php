<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Http\Requests\LoginRequest;
use Phattarachai\Tungsten\Tests\Fixtures\Models\User;

function staff(array $attributes = []): User
{
    return User::query()->create([
        'name' => 'Staff',
        'email' => 'staff@example.com',
        'password' => 'secret-password',
        ...$attributes,
    ]);
}

beforeEach(function (): void {
    RateLimiter::clear('staff@example.com|127.0.0.1');
    RateLimiter::clear(LoginRequest::accountThrottleKey('staff@example.com'));
});

function failLoginFromIps(int $times, string $email = 'staff@example.com'): void
{
    foreach (range(1, $times) as $attempt) {
        test()->withServerVariables(['REMOTE_ADDR' => "10.0.0.{$attempt}"])
            ->post('/admin/login', ['email' => $email, 'password' => "wrong-{$attempt}"])
            ->assertSessionHasErrors(['email' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง']);
    }
}

it('shows the panel login page with the labels, the brand and the forgot-password link', function (): void {
    $this->get('/admin/login')
        ->assertOk()
        ->assertViewIs('tungsten::app')
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::auth/Login', shouldExist: false)
            ->where('labels.title', 'เข้าสู่ระบบ')
            ->where('labels.intro', 'สำหรับพนักงานร้าน')
            ->where('action', url('/admin/login'))
            ->where('forgotPasswordUrl', url('/forgot-password'))
            ->where('panel.label', 'ร้านค้า')
            ->where('auth.user', null));
});

it('sends a guest on a panel route to the panel login, then back to that URL after signing in', function (): void {
    staff();

    $this->get('/admin/orders?status=paid')->assertRedirect('/admin/login');

    $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])
        ->assertRedirect(url('/admin/orders?status=paid'));

    $this->assertAuthenticated();
});

it('goes to the panel home when there is no intended URL, and full-page reloads for an Inertia request', function (): void {
    staff();

    $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'], ['X-Inertia' => 'true'])
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', url('/admin'));
});

it('remembers the user when asked', function (): void {
    $user = staff();

    $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password', 'remember' => true]);

    expect($user->fresh()->remember_token)->not->toBeNull();
});

it('refuses a wrong password with the failed label', function (): void {
    staff();

    $this->from('/admin/login')
        ->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'wrong'])
        ->assertRedirect('/admin/login')
        ->assertSessionHasErrors(['email' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง']);

    $this->assertGuest();
});

it('throttles after five failed attempts', function (): void {
    staff();

    foreach (range(1, 5) as $attempt) {
        $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'wrong']);
    }

    $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])
        ->assertSessionHasErrors('email');

    expect(session('errors')->first('email'))->toStartWith('ลองเข้าสู่ระบบหลายครั้งเกินไป');
    $this->assertGuest();
});

it('locks an account after ten failed attempts from different IPs, even against the right password', function (): void {
    staff();
    Log::spy();

    failLoginFromIps(10);

    Log::shouldHaveReceived('warning')->once()->with('Tungsten panel login locked after repeated failures', ['ip' => '10.0.0.10']);

    $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.1'])
        ->post('/admin/login', ['email' => ' Staff@Example.com ', 'password' => 'secret-password'])
        ->assertSessionHasErrors('email');

    expect(session('errors')->first('email'))
        ->toBe('บัญชีนี้ถูกล็อกชั่วคราวเพราะใส่รหัสผิดหลายครั้ง ลองใหม่ในอีก 15 นาที หรือกด "ลืมรหัสผ่าน?"');
    $this->assertGuest();
});

it('lets the account in again once the lock expires', function (): void {
    staff();

    failLoginFromIps(10);

    $this->travel(15)->minutes();

    $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.1'])
        ->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])
        ->assertSessionHasNoErrors();

    $this->assertAuthenticated();
});

it('clears the account count on a successful sign-in below the limit', function (): void {
    staff();

    failLoginFromIps(9);

    $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.1'])
        ->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])
        ->assertSessionHasNoErrors();

    expect(RateLimiter::attempts(LoginRequest::accountThrottleKey('staff@example.com')))->toBe(0);
});

it('locks only the email that failed, and not at all when the lock is turned off', function (): void {
    staff();
    staff(['email' => 'other@example.com']);

    failLoginFromIps(10);

    $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.1'])
        ->post('/admin/login', ['email' => 'other@example.com', 'password' => 'secret-password'])
        ->assertSessionHasNoErrors();

    auth()->logout();
    config(['tungsten.login.lockout.max_attempts' => null]);

    $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.2'])
        ->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])
        ->assertSessionHasNoErrors();

    $this->assertAuthenticated();
});

it('refuses a user who fails the panel ability, even with the right password', function (): void {
    staff(['id' => 500]);

    $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])
        ->assertSessionHasErrors(['email' => 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้ระบบนี้']);

    $this->assertGuest();
});

it('refuses a user the panel authorize hook turns away, with its message', function (): void {
    staff(['role' => 'system']);

    $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])
        ->assertSessionHasErrors(['email' => 'บัญชีระบบใช้หน้านี้ไม่ได้']);

    $this->assertGuest();
});

it('sends a signed-in user from the login page to the panel home', function (): void {
    $this->actingAs(staff())->get('/admin/login')->assertRedirect(url('/admin'));
});

it('signs out from the panel route and points the user menu there', function (): void {
    $user = staff();

    $this->actingAs($user)
        ->get('/admin')
        ->assertInertia(fn (Assert $page): Assert => $page->where('auth.logoutUrl', url('/admin/logout')));

    $this->post('/admin/logout')->assertRedirect(url('/admin/login'));
    $this->assertGuest();
});

it('validates the form', function (): void {
    $this->post('/admin/login', ['email' => 'not-an-email', 'password' => ''])->assertSessionHasErrors(['email', 'password']);
});
