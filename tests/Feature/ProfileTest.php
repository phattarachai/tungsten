<?php

declare(strict_types=1);

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Phattarachai\Tungsten\Tests\Fixtures\Models\User;

function member(array $attributes = []): User
{
    return User::query()->create(['name' => 'Staff', 'email' => 'staff@example.com', 'password' => 'secret-password', ...$attributes]);
}

beforeEach(fn () => Storage::fake('public'));

it('links the profile from the user menu and shows the page with the user\'s details', function (): void {
    $user = member(['avatar_path' => 'avatars/me.jpg']);

    $this->actingAs($user)
        ->get('/admin/profile')
        ->assertOk()
        ->assertInertia(fn (Assert $page): Assert => $page
            ->component('tungsten::auth/Profile', shouldExist: false)
            ->where('auth.profileUrl', url('/admin/profile'))
            ->where('auth.user.avatar', Storage::disk('public')->url('avatars/me.jpg'))
            ->where('profile', ['name' => 'Staff', 'email' => 'staff@example.com', 'avatar' => Storage::disk('public')->url('avatars/me.jpg')])
            ->where('withAvatar', true)
            ->where('labels.title', 'โปรไฟล์')
            ->where('updateUrl', url('/admin/profile')));
});

it('has no profile on a panel that did not turn it on', function (): void {
    $this->actingAs(member())->get('/tools/profile')->assertNotFound();
    $this->actingAs(member(['email' => 'two@example.com']))->get('/admin')->assertInertia(fn (Assert $page): Assert => $page->where('auth.profileUrl', url('/admin/profile')));
});

it('updates the name and email, keeping emails unique', function (): void {
    $user = member();
    member(['email' => 'taken@example.com']);

    $this->actingAs($user)->from('/admin/profile')
        ->put('/admin/profile', ['name' => 'สมชาย', 'email' => 'taken@example.com'])
        ->assertSessionHasErrors('email');

    $this->actingAs($user)->from('/admin/profile')
        ->put('/admin/profile', ['name' => 'สมชาย', 'email' => 'somchai@example.com'])
        ->assertRedirect('/admin/profile')
        ->assertSessionHas('flash', ['message' => 'บันทึกโปรไฟล์แล้ว', 'tone' => 'success']);

    expect($user->fresh()->only('name', 'email'))->toBe(['name' => 'สมชาย', 'email' => 'somchai@example.com']);
});

it('stores, replaces and removes the photo on the panel\'s disk', function (): void {
    $user = member();

    $this->actingAs($user)->put('/admin/profile', ['name' => 'Staff', 'email' => 'staff@example.com', 'avatar' => UploadedFile::fake()->image('a.jpg')]);
    $first = $user->fresh()->avatar_path;
    Storage::disk('public')->assertExists($first);

    $this->actingAs($user)->put('/admin/profile', ['name' => 'Staff', 'email' => 'staff@example.com', 'avatar' => UploadedFile::fake()->image('b.jpg')]);
    $second = $user->fresh()->avatar_path;
    Storage::disk('public')->assertExists($second);
    Storage::disk('public')->assertMissing($first);

    $this->actingAs($user)->put('/admin/profile', ['name' => 'Staff', 'email' => 'staff@example.com', 'remove_avatar' => true]);
    expect($user->fresh()->avatar_path)->toBeNull();
    Storage::disk('public')->assertMissing($second);

    $this->actingAs($user)->put('/admin/profile', ['name' => 'Staff', 'email' => 'staff@example.com', 'avatar' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')])
        ->assertSessionHasErrors('avatar');
});

it('changes the password only with the current one, confirmed', function (): void {
    $user = member();

    $this->actingAs($user)->put('/admin/profile/password', ['current_password' => 'wrong', 'password' => 'new-secret-123', 'password_confirmation' => 'new-secret-123'])
        ->assertSessionHasErrors('current_password');
    $this->actingAs($user)->put('/admin/profile/password', ['current_password' => 'secret-password', 'password' => 'new-secret-123', 'password_confirmation' => 'nope'])
        ->assertSessionHasErrors('password');

    $this->actingAs($user)->put('/admin/profile/password', ['current_password' => 'secret-password', 'password' => 'new-secret-123', 'password_confirmation' => 'new-secret-123'])
        ->assertSessionHas('flash', ['message' => 'เปลี่ยนรหัสผ่านแล้ว', 'tone' => 'success']);

    expect(Hash::check('new-secret-123', $user->fresh()->password))->toBeTrue();
});

it('keeps the profile behind the panel auth', function (): void {
    $this->get('/admin/profile')->assertRedirect('/admin/login');
});
