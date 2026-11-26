import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { FormField } from '../ui/form'
import { Heading } from '../ui/RecordParts'
import { Switch } from '../ui/Switch'
import { noticeStore, serverSnapshot } from '../../lib/noticeStore'
import { strings } from '../../lib/strings'

/**
 * The live bell's switches (`->notifications(live: true)`): a desktop notification for what arrives while the tab is
 * behind, and a sound. Remembered per browser; `url` and `user` are the bell's, so the bell hears a change at once.
 */
export function NotificationPreferences({ url, user }) {
    const store = useMemo(() => noticeStore(url, user), [url, user])
    const { desktop, sound } = useSyncExternalStore(store.subscribe, store.snapshot, serverSnapshot)

    useEffect(() => store.refresh?.(), [store])

    return (
        <section className="space-y-3">
            <Heading>{strings.notifications}</Heading>
            <p className="text-xs text-zinc-500">{strings.notificationPreferencesHint}</p>
            {desktop !== 'unsupported' && (
                <FormField label={strings.desktopNotifications} hint={desktop === 'blocked' ? strings.desktopBlockedHint : strings.desktopNotificationsHint}>
                    <div className="pt-1">
                        <Switch label={strings.desktopNotifications} checked={desktop === 'on'} disabled={desktop === 'blocked'} onChange={store.setDesktop} />
                    </div>
                </FormField>
            )}
            <FormField label={strings.notificationSound} hint={strings.notificationSoundHint}>
                <div className="pt-1">
                    <Switch label={strings.notificationSound} checked={sound} onChange={store.setSound} />
                </div>
            </FormField>
        </section>
    )
}
