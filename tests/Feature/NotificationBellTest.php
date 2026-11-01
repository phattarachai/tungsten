<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;
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
