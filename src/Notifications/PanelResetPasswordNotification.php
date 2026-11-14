<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * The panel's reset-password mail, in the login's labels (`mailSubject`, `mailIntro` …). Tungsten sends it through the
 * password broker's callback, so the app's own `ResetPassword` notification and `ResetPassword::createUrlUsing()` (which
 * Filament sets) are left alone. It is queued, so the forgot-password answer takes as long for an unknown email as for a
 * known one.
 */
class PanelResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, string>  $labels
     */
    public function __construct(public readonly string $url, public readonly int $expireMinutes, public readonly array $labels) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = trim((string) data_get($notifiable, 'name', ''));

        return (new MailMessage)
            ->subject($this->label('mailSubject'))
            ->greeting($this->label('mailGreeting', [':name' => $name]))
            ->line($this->label('mailIntro', [':app' => (string) config('app.name')]))
            ->action($this->label('mailAction'), $this->url)
            ->line($this->label('mailExpire', [':count' => (string) $this->expireMinutes]))
            ->line($this->label('mailIgnore'));
    }

    /**
     * @param  array<string, string>  $replace
     */
    private function label(string $key, array $replace = []): string
    {
        return strtr($this->labels[$key] ?? $key, $replace);
    }
}
