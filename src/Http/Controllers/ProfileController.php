<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Phattarachai\Tungsten\Auth\AuthSession;
use Phattarachai\Tungsten\Contracts\HasPanelAvatar;
use Phattarachai\Tungsten\Contracts\HasTwoFactor;
use Phattarachai\Tungsten\Events\PanelUserEmailChanged;
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
                'hasAvatar' => $profile->hasAvatar($request->user()),
            ],
            'withAvatar' => $profile->acceptsAvatar($request->user()),
            'emailEditable' => $profile->emailEditable,
            'updateUrl' => route("{$panel->getId()}.profile.update"),
            'passwordUrl' => route("{$panel->getId()}.profile.password"),
            'twoFactor' => $this->twoFactor($request, $panel),
        ]);
    }

    /**
     * The two-factor section, for a panel with `->login(twoFactor: ...)` and a {@see HasTwoFactor} user; new recovery
     * codes are shown once, right after they're made.
     *
     * @return array<string, mixed>|null
     */
    private function twoFactor(Request $request, Panel $panel): ?array
    {
        $twoFactor = $panel->getLogin()?->twoFactor;
        $user = $request->user();

        if ($twoFactor === null || ! $user instanceof HasTwoFactor) {
            return null;
        }

        $id = $panel->getId();
        $codes = $request->session()->get(AuthSession::RECOVERY_CODES);
        $labels = $panel->getProfile()?->labels() ?? [];
        $enabled = $user->hasTwoFactorEnabled();

        return [
            'enabled' => $enabled,
            'status' => $enabled
                ? ['label' => $labels['twoFactorEnabled'] ?? 'on', 'tone' => 'done']
                : ['label' => $labels['twoFactorNotEnabled'] ?? 'off', 'tone' => 'draft'],
            'required' => $twoFactor->requiredFor($user),
            'recoveryCodesLeft' => count($user->getTwoFactorRecoveryCodes()),
            'newRecoveryCodes' => is_array($codes) ? array_values($codes) : null,
            'setupUrl' => route("{$id}.two-factor.setup"),
            'renewUrl' => route("{$id}.two-factor.setup", ['renew' => 1]),
            'regenerateUrl' => route("{$id}.profile.two-factor.recovery-codes"),
            'disableUrl' => route("{$id}.profile.two-factor.destroy"),
        ];
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        [$panel, $profile] = $this->panelProfile($request);

        /** @var Model $user */
        $user = $request->user();
        $oldEmail = (string) $user->getAttribute('email');
        $user->forceFill($request->safe()->only($profile->emailEditable ? ['name', 'email'] : ['name']));

        if ($profile->avatar !== null && ! $user instanceof HasPanelAvatar) {
            $this->storeAvatar($user, $profile, $request->file('avatar'), $request->boolean('remove_avatar'));
        }

        $user->save();

        if ($user->wasChanged('email') && $user instanceof Authenticatable) {
            PanelUserEmailChanged::dispatch($user, $oldEmail, (string) $user->getAttribute('email'), $panel->getId());
        }

        if ($user instanceof HasPanelAvatar) {
            $this->handOverAvatar($user, $request->file('avatar'), $request->boolean('remove_avatar'));
        }

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
     * The user's own {@see HasPanelAvatar} stores it; a form with no new photo and no removal leaves it alone.
     */
    private function handOverAvatar(HasPanelAvatar $user, ?UploadedFile $file, bool $remove): void
    {
        if ($file !== null || $remove) {
            $user->setPanelAvatar($file);
        }
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
