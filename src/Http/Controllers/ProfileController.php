<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Http\Requests\UpdatePasswordRequest;
use Phattarachai\Tungsten\Http\Requests\UpdateProfileRequest;
use Phattarachai\Tungsten\Panel;
use Phattarachai\Tungsten\PanelProfile;
use Phattarachai\Tungsten\PanelRegistry;

/**
 * The signed-in user's own profile, registered by {@see Panel::profile()}: name, email, an optional photo, password.
 */
class ProfileController
{
    public function __construct(private readonly PanelRegistry $panels) {}

    public function show(Request $request): Response
    {
        [$panel, $profile] = $this->panelProfile($request);

        return Inertia::render('tungsten::auth/Profile', [
            'labels' => $profile->labels(),
            'profile' => [
                'name' => data_get($request->user(), 'name'),
                'email' => data_get($request->user(), 'email'),
                'avatar' => $profile->avatarUrl($request->user()),
            ],
            'withAvatar' => $profile->avatar !== null,
            'updateUrl' => route("{$panel->getId()}.profile.update"),
            'passwordUrl' => route("{$panel->getId()}.profile.password"),
        ]);
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        [, $profile] = $this->panelProfile($request);

        /** @var Model $user */
        $user = $request->user();
        $user->forceFill($request->safe()->only(['name', 'email']));

        if ($profile->avatar !== null) {
            $this->storeAvatar($user, $profile, $request->file('avatar'), $request->boolean('remove_avatar'));
        }

        $user->save();

        return back()->with('flash', ['message' => $profile->labels()['saved'] ?? 'saved', 'tone' => 'success']);
    }

    public function password(UpdatePasswordRequest $request): RedirectResponse
    {
        [, $profile] = $this->panelProfile($request);

        /** @var Model $user */
        $user = $request->user();
        $user->forceFill(['password' => Hash::make((string) $request->validated('password'))])->save();

        return back()->with('flash', ['message' => $profile->labels()['passwordSaved'] ?? 'saved', 'tone' => 'success']);
    }

    /**
     * Replaces (or, with `$remove`, clears) the photo, deleting the old file.
     */
    private function storeAvatar(Model $user, PanelProfile $profile, ?UploadedFile $file, bool $remove): void
    {
        $column = (string) $profile->avatar;
        $old = $user->getAttribute($column);

        if ($file === null && ! $remove) {
            return;
        }

        if (is_string($old) && $old !== '') {
            Storage::disk($profile->disk)->delete($old);
        }

        $user->setAttribute($column, $file?->store('avatars', $profile->disk) ?: null);
    }

    /**
     * @return array{Panel, PanelProfile}
     */
    private function panelProfile(Request $request): array
    {
        $panel = $this->panels->forRoute($request->route()?->getName());
        $profile = $panel?->getProfile();

        abort_unless($panel instanceof Panel && $profile instanceof PanelProfile, 404);

        return [$panel, $profile];
    }
}
