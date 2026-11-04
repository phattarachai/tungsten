<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Requests;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Override;
use Phattarachai\Tungsten\PanelRegistry;

class UpdateProfileRequest extends FormRequest
{
    #[Override]
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');

        if (is_string($email)) {
            $this->merge(['email' => Str::lower(trim($email))]);
        }
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        /** @var Model $user */
        $user = $this->user();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique($user->getTable(), 'email')->ignore($user->getKey(), $user->getKeyName())],
            'avatar' => ['nullable', 'image', 'max:'.(int) config('tungsten.profile.avatar_max', 2048)],
            'remove_avatar' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    #[Override]
    public function attributes(): array
    {
        $labels = resolve(PanelRegistry::class)->forRoute($this->route()?->getName())?->getProfile()?->labels();

        return ['avatar' => $labels['avatar'] ?? 'avatar'];
    }
}
