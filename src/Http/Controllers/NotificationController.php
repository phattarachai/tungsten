<?php

declare(strict_types=1);

namespace Phattarachai\Tungsten\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\HasDatabaseNotifications;

/**
 * The topbar bell: the signed-in user's latest database notifications and how many are unread; marking one or all
 * read. Users without Laravel's `Notifiable` get an empty bell.
 */
class NotificationController
{
    private const int LATEST = 20;

    public function index(Request $request): JsonResponse
    {
        $user = $this->notifiable($request);

        if ($user === null) {
            return response()->json(['unread' => 0, 'items' => []]);
        }

        $items = $user->notifications()->latest()->limit(self::LATEST)->get()->map($this->item(...))->values()->all();

        return response()->json(['unread' => $user->unreadNotifications()->count(), 'items' => $items]);
    }

    public function read(Request $request, string $notification): JsonResponse
    {
        $this->owned($request, $notification)?->markAsRead();

        return $this->index($request);
    }

    public function readAll(Request $request): JsonResponse
    {
        $this->notifiable($request)?->unreadNotifications()->update(['read_at' => now()]);

        return $this->index($request);
    }

    /**
     * The signed-in user when it has Laravel's database notifications (the `Notifiable` trait), else null.
     */
    private function notifiable(Request $request): mixed
    {
        $user = $request->user();

        return is_object($user) && in_array(HasDatabaseNotifications::class, class_uses_recursive($user), true) ? $user : null;
    }

    private function owned(Request $request, string $id): ?DatabaseNotification
    {
        return $this->notifiable($request)?->notifications()->whereKey($id)->first();
    }

    /**
     * @return array{id: string, title: string, body: ?string, url: ?string, tone: ?string, icon: ?string, read: bool, at: ?string}
     */
    private function item(DatabaseNotification $notification): array
    {
        $data = (array) $notification->getAttribute('data');

        return [
            'id' => (string) $notification->getKey(),
            'title' => (string) ($data['title'] ?? $data['message'] ?? class_basename((string) $notification->getAttribute('type'))),
            'body' => isset($data['body']) ? (string) $data['body'] : null,
            'url' => isset($data['url']) ? (string) $data['url'] : null,
            'tone' => isset($data['tone']) ? (string) $data['tone'] : null,
            'icon' => isset($data['icon']) ? (string) $data['icon'] : null,
            'read' => $notification->getAttribute('read_at') !== null,
            'at' => $notification->getAttribute('created_at')?->toIso8601String(),
        ];
    }
}
