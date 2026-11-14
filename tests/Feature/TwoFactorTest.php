<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Auth\AuthSession;
use Phattarachai\Tungsten\Tests\Fixtures\Models\User;
use Phattarachai\Tungsten\Tungsten;
use PragmaRX\Google2FA\Google2FA;

const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

function twoFactorUser(array $attributes = [], bool $enrolled = false): User
{
    $user = User::query()->create(['name' => 'Staff', 'email' => 'staff@example.com', 'password' => 'secret-password', ...$attributes]);

    if ($enrolled) {
        $user->enableTwoFactor(SECRET, ['aaaaa-11111', 'bbbbb-22222']);
    }

    return $user;
}

function currentCode(string $secret = SECRET): string
{
    return app(Google2FA::class)->getCurrentOtp($secret);
}

/** A session that has already given a code, the way a full sign-in leaves it. */
function verifiedSession(User $user): array
{
    return [AuthSession::AMR => ['user' => (string) $user->getKey(), 'methods' => ['pwd', 'otp']]];
}

beforeEach(function (): void {
    Cache::flush();
    RateLimiter::clear('staff@example.com|127.0.0.1');
});

it('holds an enrolled user at the challenge after the password, signed out until the code', function (): void {
    twoFactorUser(enrolled: true);

    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password', 'remember' => true])
        ->assertRedirect(url('/staff/two-factor-challenge'));

    $this->assertGuest();
    $this->get('/staff')->assertRedirect(url('/staff/login'));

    $this->get('/staff/two-factor-challenge')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::auth/TwoFactorChallenge', shouldExist: false)
            ->where('labels.challengeTitle', 'ยืนยันตัวตนสองขั้นตอน')
            ->where('action', url('/staff/two-factor-challenge'))
            ->where('logoutUrl', null));
});

it('signs in with the authenticator code, keeps remember, and records pwd and otp', function (): void {
    $user = twoFactorUser(enrolled: true);
    session()->put('url.intended', url('/staff'));

    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password', 'remember' => true]);
    $this->post('/staff/two-factor-challenge', ['code' => currentCode()])->assertRedirect(url('/staff'));

    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->remember_token)->not->toBeNull()
        ->and(Tungsten::amr($user))->toBe(['pwd', 'otp'])
        ->and(session(AuthSession::CHALLENGE))->toBeNull();

    $this->get('/staff')->assertOk();
});

it('refuses a wrong code, a code used before, and throttles after five tries', function (): void {
    $user = twoFactorUser(enrolled: true);

    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password']);
    $this->post('/staff/two-factor-challenge', ['code' => '000000'])->assertSessionHasErrors(['code' => 'รหัสไม่ถูกต้อง']);
    $this->post('/staff/two-factor-challenge', ['code' => currentCode()]);
    $this->assertAuthenticatedAs($user);

    $this->post('/staff/logout');
    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password']);
    $this->post('/staff/two-factor-challenge', ['code' => currentCode()])->assertSessionHasErrors(['code' => 'รหัสไม่ถูกต้อง']);
    $this->assertGuest();

    foreach (range(1, 4) as $attempt) {
        $this->post('/staff/two-factor-challenge', ['code' => '000000']);
    }

    $this->post('/staff/two-factor-challenge', ['recovery_code' => 'aaaaa-11111'])->assertSessionHasErrors('recovery_code');
    expect(session('errors')->first('recovery_code'))->toStartWith('ลองหลายครั้งเกินไป');
    $this->assertGuest();
});

it('takes each recovery code once', function (): void {
    $user = twoFactorUser(enrolled: true);

    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password']);
    $this->post('/staff/two-factor-challenge', ['recovery_code' => ' AAAAA-11111 '])->assertRedirect();

    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->getTwoFactorRecoveryCodes())->toBe(['bbbbb-22222'])
        ->and(Tungsten::amr($user))->toBe(['pwd', 'otp']);

    $this->post('/staff/logout');
    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password']);
    $this->post('/staff/two-factor-challenge', ['recovery_code' => 'aaaaa-11111'])
        ->assertSessionHasErrors(['recovery_code' => 'รหัสสำรองไม่ถูกต้องหรือใช้ไปแล้ว']);
    $this->assertGuest();
});

it('sends a challenge with nothing waiting back to the login', function (): void {
    $this->get('/staff/two-factor-challenge')
        ->assertRedirect(url('/staff/login'))
        ->assertSessionHas('status', 'หมดเวลายืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง');

    twoFactorUser(enrolled: true);
    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password']);
    $this->travel(11)->minutes();

    $this->post('/staff/two-factor-challenge', ['code' => currentCode()])->assertRedirect(url('/staff/login'));
    $this->assertGuest();
});

it('holds a user who must use two-factor at setup from their first sign-in until they enrol', function (): void {
    $user = twoFactorUser(['role' => 'manager']);

    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])->assertRedirect(url('/staff'));
    $this->assertAuthenticatedAs($user);
    expect(Tungsten::amr($user))->toBe(['pwd']);

    $this->get('/staff')->assertRedirect(url('/staff/two-factor/setup'));
    $this->get('/staff/profile')->assertRedirect(url('/staff/two-factor/setup'));
    $this->get('/outside/tools')->assertRedirect(url('/staff/two-factor/setup'));
    $this->post('/staff/profile/two-factor/recovery-codes', [], ['X-Inertia' => 'true'])->assertStatus(409);

    $this->get('/staff/two-factor/setup')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::auth/TwoFactorSetup', shouldExist: false)
            ->where('required', true)
            ->where('renew', false)
            ->where('cancelUrl', null)
            ->where('qr', fn (string $svg): bool => str_starts_with($svg, '<svg'))
            ->where('logoutUrl', url('/staff/logout')));

    $secret = session(AuthSession::SETUP)['secret'];

    $this->post('/staff/two-factor/setup', ['code' => '000000'])->assertSessionHasErrors(['code' => 'รหัสไม่ถูกต้อง']);
    expect($user->fresh()->hasTwoFactorEnabled())->toBeFalse();

    $this->post('/staff/two-factor/setup', ['code' => currentCode($secret)])->assertRedirect(url('/staff/two-factor/setup'));

    $fresh = $user->fresh();
    expect($fresh->hasTwoFactorEnabled())->toBeTrue()
        ->and($fresh->getTwoFactorSecret())->toBe($secret)
        ->and($fresh->getTwoFactorRecoveryCodes())->toHaveCount(8)
        ->and(Tungsten::amr($user))->toBe(['pwd', 'otp']);

    $this->get('/staff/two-factor/setup')->assertInertia(fn (Assert $page): Assert => $page
        ->where('recoveryCodes', $fresh->getTwoFactorRecoveryCodes())
        ->where('continueUrl', url('/outside/tools')));

    $this->get('/staff')->assertOk();
    $this->get('/outside/tools')->assertOk()->assertSee('dev tools');
});

it('signs out a session that did not type the password before it can enrol a phone', function (): void {
    $user = twoFactorUser(['role' => 'manager']);

    // A session restored from a remember-me cookie, or signed in by another form: no `pwd` recorded.
    $this->actingAs($user)->get('/staff')->assertRedirect(url('/staff/two-factor/setup'));
    $this->get('/staff/two-factor/setup')
        ->assertRedirect(url('/staff/login'))
        ->assertSessionHas('status', 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านอีกครั้ง ก่อนตั้งค่าการยืนยันตัวตนสองขั้นตอน');
    $this->assertGuest();

    $this->actingAs($user)->post('/staff/two-factor/setup', ['code' => currentCode()])->assertRedirect(url('/staff/login'));
    $this->assertGuest();
    expect($user->fresh()->hasTwoFactorEnabled())->toBeFalse();

    // An enrolled user who only gave a code this session can't move to a new phone either.
    $user->enableTwoFactor(SECRET, ['aaaaa-11111']);
    $this->actingAs($user)->withSession([AuthSession::AMR => ['user' => (string) $user->getKey(), 'methods' => ['otp']]])
        ->get('/staff/two-factor/setup?renew=1')
        ->assertRedirect(url('/staff/login'));
    $this->assertGuest();
});

it('lets a user who is not required pass without enrolling, and enrol from the profile', function (): void {
    $user = twoFactorUser();

    $this->post('/staff/login', ['email' => 'staff@example.com', 'password' => 'secret-password']);
    $this->get('/staff')->assertOk();

    $this->get('/staff/profile')->assertInertia(fn (Assert $page): Assert => $page
        ->where('twoFactor.enabled', false)
        ->where('twoFactor.required', false)
        ->where('twoFactor.status', ['label' => 'ยังไม่เปิด', 'tone' => 'draft'])
        ->where('twoFactor.setupUrl', url('/staff/two-factor/setup')));

    $this->get('/staff/two-factor/setup')->assertInertia(fn (Assert $page): Assert => $page->where('cancelUrl', url('/staff/profile')));
    $this->post('/staff/two-factor/setup', ['code' => currentCode(session(AuthSession::SETUP)['secret'])]);

    expect($user->fresh()->hasTwoFactorEnabled())->toBeTrue();
});

it('challenges an enrolled user who signed in another way, on panel and outside routes, then returns them', function (): void {
    $user = twoFactorUser(enrolled: true);

    $this->actingAs($user)->get('/outside/tools')->assertRedirect(url('/staff/two-factor-challenge'));
    $this->get('/staff')->assertRedirect(url('/staff/two-factor-challenge'));
    $this->get('/staff/two-factor/setup?renew=1')->assertRedirect(url('/staff/two-factor-challenge'));
    $this->post('/staff/two-factor/setup', ['code' => currentCode()])->assertRedirect(url('/staff/two-factor-challenge'));

    $this->get('/staff/two-factor-challenge')->assertInertia(fn (Assert $page): Assert => $page->where('logoutUrl', url('/staff/logout')));
    session()->put('url.intended', url('/outside/tools'));

    $this->post('/staff/two-factor-challenge', ['code' => currentCode()])->assertRedirect(url('/outside/tools'));
    expect(Tungsten::amr($user))->toBe(['otp']);
    $this->get('/outside/tools')->assertOk();
});

it('does not carry one user\'s verified session over to another', function (): void {
    $first = twoFactorUser(enrolled: true);
    $second = User::query()->create(['name' => 'Other', 'email' => 'other@example.com', 'password' => 'secret-password']);
    $second->enableTwoFactor(SECRET, []);

    $this->actingAs($second)->withSession(verifiedSession($first))->get('/staff')->assertRedirect(url('/staff/two-factor-challenge'));
});

it('moves an enrolled user to a new phone without breaking the old one until the new code confirms it', function (): void {
    $user = twoFactorUser(enrolled: true);
    $this->actingAs($user)->withSession(verifiedSession($user));

    $this->get('/staff/two-factor/setup')->assertRedirect(url('/staff/profile'));
    $this->get('/staff/two-factor/setup?renew=1')->assertInertia(fn (Assert $page): Assert => $page->where('renew', true));

    $newSecret = session(AuthSession::SETUP)['secret'];
    expect($newSecret)->not->toBe(SECRET)
        ->and($user->fresh()->getTwoFactorSecret())->toBe(SECRET);

    $this->post('/staff/two-factor/setup', ['code' => currentCode($newSecret)]);

    expect($user->fresh()->getTwoFactorSecret())->toBe($newSecret);
});

it('regenerates recovery codes and shows them once on the profile', function (): void {
    $user = twoFactorUser(enrolled: true);
    $this->actingAs($user)->withSession(verifiedSession($user));

    $this->get('/staff/profile')->assertInertia(fn (Assert $page): Assert => $page
        ->where('twoFactor.enabled', true)
        ->where('twoFactor.recoveryCodesLeft', 2)
        ->where('twoFactor.newRecoveryCodes', null));

    $this->from('/staff/profile')->post('/staff/profile/two-factor/recovery-codes')->assertRedirect('/staff/profile');
    $codes = $user->fresh()->getTwoFactorRecoveryCodes();

    expect($codes)->toHaveCount(8)->not->toContain('aaaaa-11111');

    $this->get('/staff/profile')->assertInertia(fn (Assert $page): Assert => $page->where('twoFactor.newRecoveryCodes', $codes));
    $this->get('/staff/profile')->assertInertia(fn (Assert $page): Assert => $page->where('twoFactor.newRecoveryCodes', null));
});

it('turns two-factor off with the password, only for a user who is not required', function (): void {
    $user = twoFactorUser(enrolled: true);
    $this->actingAs($user)->withSession(verifiedSession($user));

    $this->delete('/staff/profile/two-factor', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
    expect($user->fresh()->hasTwoFactorEnabled())->toBeTrue();

    $this->delete('/staff/profile/two-factor', ['current_password' => 'secret-password'])->assertSessionHasNoErrors();
    expect($user->fresh()->hasTwoFactorEnabled())->toBeFalse();

    $manager = User::query()->create(['name' => 'M', 'email' => 'manager@example.com', 'password' => 'secret-password', 'role' => 'manager']);
    $manager->enableTwoFactor(SECRET, []);

    $this->actingAs($manager)->withSession(verifiedSession($manager))
        ->delete('/staff/profile/two-factor', ['current_password' => 'secret-password'])
        ->assertSessionHasErrors(['current_password' => 'บัญชีนี้ต้องเปิดใช้ ปิดไม่ได้']);
    expect($manager->fresh()->hasTwoFactorEnabled())->toBeTrue();
});

it('leaves a panel without twoFactor as it was, even for an enrolled user', function (): void {
    $user = twoFactorUser(enrolled: true);

    $this->get('/admin/two-factor-challenge')->assertNotFound();
    $this->post('/admin/login', ['email' => 'staff@example.com', 'password' => 'secret-password'])->assertRedirect(url('/admin'));

    $this->assertAuthenticatedAs($user);
    expect(Tungsten::amr($user))->toBe(['pwd']);
    $this->get('/admin/profile')->assertInertia(fn (Assert $page): Assert => $page->where('twoFactor', null));
});
