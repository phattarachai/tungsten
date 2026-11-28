<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Concerns\Panel;

use Phattarachai\Tungsten\Panel;

/**
 * A {@see Panel}'s topbar notification bell.
 */
trait HasNotifications
{
    private ?int $notificationPoll = null;

    private bool $liveNotifications = false;

    private ?string $allNotifications = null;

    /**
     * Turns on the topbar's notification bell over the user's Laravel database notifications (the `notifications`
     * table, a `Notifiable` user), refreshed every `$poll` seconds while the tab is visible.
     *
     * `$live` announces what arrives while a page is open: a toast, the unread count in the tab title, and per browser,
     * as the user chooses on the profile page, a desktop notification while the tab is behind and a sound. `$all` is the
     * route name of the page that lists every notification, linked at the menu's foot.
     */
    public function notifications(int $poll = 30, bool $live = false, ?string $all = null): self
    {
        $this->notificationPoll = max(5, $poll);
        $this->liveNotifications = $live;
        $this->allNotifications = $all;

        return $this;
    }

    public function getNotificationPoll(): ?int
    {
        return $this->notificationPoll;
    }

    public function hasLiveNotifications(): bool
    {
        return $this->liveNotifications;
    }

    /**
     * The page that lists every notification; null when none is named or its route isn't registered.
     */
    public function allNotificationsUrl(): ?string
    {
        return $this->allNotifications !== null && app('router')->has($this->allNotifications) ? route($this->allNotifications) : null;
    }
}
