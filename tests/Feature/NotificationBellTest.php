<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelRegistry;
use Phattarachai\Tungsten\Tests\Fixtures\Models\User;
use Phattarachai\Tungsten\Tests\Fixtures\Notifications\OrderPaid;

function notifiable(string $email = 'staff@example.com'): User
{
    return User::query()->create(['name' => 'Staff', 'email' => $email, 'password' => 'secret-password']);
}

it('shares the bell with panels that turn it on', function (): void {
    $user = notifiable();

    $this->actingAs($user)->get('/admin/orders')->assertInertia(fn (Assert $page): Assert => $page->where('panel.notifications', ['url' => url('/admin/notifications'), 'poll' => 15]));
    $this->actingAs($user)->get('/tools')->assertInertia(fn (Assert $page): Assert => $page->where('panel.notifications', null));
});

it('shares the live bell and the link to every notification only when the panel asks', function (): void {
    $panel = app(PanelRegistry::class)->find('admin');
    $props = fn (): array => $this->actingAs($this->admin())->get('/admin/orders')->inertiaProps('panel.notifications');

    $panel->notifications(poll: 10, live: true, all: 'admin.orders');
    expect($props())->toBe(['url' => url('/admin/notifications'), 'poll' => 10, 'live' => true, 'all' => url('/admin/orders')]);

    $panel->notifications(all: 'admin.nowhere');
    expect($props())->toBe(['url' => url('/admin/notifications'), 'poll' => 30]);
});

it('keeps the old defaults and never polls faster than every 5 seconds', function (): void {
    $panel = fn (): Panel => app(PanelRegistry::class)->find('admin');

    $panel()->notifications();
    expect([$panel()->getNotificationPoll(), $panel()->hasLiveNotifications(), $panel()->allNotificationsUrl()])->toBe([30, false, null]);

    $panel()->notifications(poll: 1, live: true);
    expect([$panel()->getNotificationPoll(), $panel()->hasLiveNotifications()])->toBe([5, true]);
});

it('keeps the line breaks of a body', function (): void {
    $user = notifiable();
    $user->notifications()->create(['id' => (string) str()->uuid(), 'type' => 'notice', 'data' => ['title' => 'ร้านใหม่', 'body' => "ร้านทอง\nแพ็กเกจ S"]]);

    $this->actingAs($user)->getJson('/admin/notifications')->assertJsonPath('items.0.body', "ร้านทอง\nแพ็กเกจ S");
});

it('answers the bell without writing to the session, so a host may leave it unsaved', function (): void {
    $user = notifiable();
    $user->notify(new OrderPaid('SO-1'));
    $this->app->singleton(StartSession::class, fn ($app): StartSession => new class($app['session'], null) extends StartSession
    {
        public array $before = [];

        public array $after = [];

        protected function startSession(Request $request, $session)
        {
            return tap(parent::startSession($request, $session), function ($session): void {
                $this->before = $session->all();
            });
        }

        protected function saveSession($request): void
        {
            $this->after = $request->session()->all();
        }
    });

    $this->actingAs($user)
        ->withSession(['flash' => 'บันทึกแล้ว', '_flash' => ['new' => ['flash'], 'old' => []], '_previous' => ['url' => url('/admin/orders'), 'route' => 'admin.orders']])
        ->getJson('/admin/notifications', ['X-Requested-With' => 'XMLHttpRequest'])
        ->assertOk()
        ->assertJsonPath('unread', 1);

    $session = app(StartSession::class);

    expect($session->before)->toHaveKey('flash')->and($session->after)->toBe($session->before);
});

it('lists the latest notifications with the unread count and the panel fields', function (): void {
    $user = notifiable();
    $user->notify(new OrderPaid('SO-1'));
    $user->notify(new OrderPaid('SO-2'));

    $this->actingAs($user)
        ->getJson('/admin/notifications')
        ->assertOk()
        ->assertJsonPath('unread', 2)
        ->assertJsonCount(2, 'items')
        ->assertJsonPath('items.0.title', 'ชำระเงินแล้ว')
        ->assertJsonPath('items.0.tone', 'done')
        ->assertJsonPath('items.0.icon', 'wallet')
        ->assertJsonPath('items.0.read', false);
});

it('marks one read, then all read, and only the user\'s own', function (): void {
    $user = notifiable();
    $other = notifiable('other@example.com');
    $user->notify(new OrderPaid('SO-1'));
    $user->notify(new OrderPaid('SO-2'));
    $other->notify(new OrderPaid('SO-9'));

    $mine = $user->notifications()->first();
    $theirs = $other->notifications()->first();

    $this->actingAs($user)->postJson("/admin/notifications/{$mine->id}/read")->assertOk()->assertJsonPath('unread', 1);
    $this->actingAs($user)->postJson("/admin/notifications/{$theirs->id}/read")->assertOk()->assertJsonPath('unread', 1);
    expect($theirs->fresh()->read_at)->toBeNull();

    $this->actingAs($user)->postJson('/admin/notifications/read')->assertOk()->assertJsonPath('unread', 0);
    expect($other->unreadNotifications()->count())->toBe(1);
});

it('gives a user without database notifications an empty bell', function (): void {
    $this->actingAs($this->admin())->getJson('/admin/notifications')->assertOk()->assertExactJson(['unread' => 0, 'items' => []]);
});

it('keeps the bell behind the panel auth', function (): void {
    $this->getJson('/admin/notifications')->assertUnauthorized();
    $this->postJson('/admin/notifications/read')->assertUnauthorized();
});
