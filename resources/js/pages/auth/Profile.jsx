import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Avatar } from '../../components/panel/Avatar'
import { NotificationPreferences } from '../../components/panel/NotificationPreferences'
import { RecoveryCodes } from '../../components/panel/RecoveryCodes'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { FormDialog } from '../../components/ui/FormDialog'
import { FormField, Input, PasswordInput } from '../../components/ui/form'
import { IconButton } from '../../components/ui/IconButton'
import { PageHeader } from '../../components/ui/PageHeader'
import { Heading, Rule } from '../../components/ui/RecordParts'
import { AppLayout } from '../../layouts/AppLayout'

/**
 * The photo with a file picker; the preview is the picked file until it's saved. The trash icon drops a picked file and
 * removes the user's own photo (`hasAvatar`), so a generated placeholder offers nothing to remove.
 */
export function AvatarField({ labels, current, hasAvatar, name, form }) {
    const picker = useRef(null)
    const [preview, setPreview] = useState(null)

    useEffect(() => {
        if (!form.data.avatar) {
            setPreview(null)

            return undefined
        }

        const url = URL.createObjectURL(form.data.avatar)
        setPreview(url)

        return () => URL.revokeObjectURL(url)
    }, [form.data.avatar])

    const shown = form.data.remove_avatar ? null : (preview ?? current)
    const removable = form.data.avatar || (hasAvatar && !form.data.remove_avatar)

    function remove() {
        picker.current.value = ''
        form.setData((data) => ({ ...data, avatar: null, remove_avatar: hasAvatar }))
    }

    return (
        <FormField label={labels.avatar} error={form.errors.avatar}>
            <div className="flex items-center gap-3">
                <Avatar person={{ avatar: shown, name }} className="size-14 text-lg" />
                <input
                    ref={picker}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                        form.setData((data) => ({ ...data, avatar: event.target.files?.[0] ?? null, remove_avatar: false }))
                    }}
                />
                <Button variant="outline" size="sm" onClick={() => picker.current?.click()}>
                    {labels.changeAvatar}
                </Button>
                {removable && <IconButton icon={Trash2} label={labels.removeAvatar} tone="danger" onClick={remove} />}
            </div>
        </FormField>
    )
}

/**
 * Two-factor on the profile (`->login(twoFactor: ...)`): on or off, recovery codes left, and the actions: turn it on,
 * move to a new phone, new recovery codes (shown once, right here), turn it off (password first; not when required).
 */
export function TwoFactorSection({ labels, twoFactor }) {
    const [disabling, setDisabling] = useState(false)
    const regenerate = useForm({})
    const disable = useForm({ _method: 'delete', current_password: '' })

    function submitDisable() {
        disable.post(twoFactor.disableUrl, { preserveScroll: true, onSuccess: () => setDisabling(false), onFinish: () => disable.reset('current_password') })
    }

    return (
        <section className="space-y-3">
            <Heading>{labels.twoFactor}</Heading>
            <div className="flex flex-wrap items-center gap-2">
                <Badge tone={twoFactor.status.tone}>{twoFactor.status.label}</Badge>
                <span className="text-zinc-600">{twoFactor.enabled ? labels.twoFactorOn : labels.twoFactorOff}</span>
            </div>
            {twoFactor.enabled && (
                <p className="text-zinc-500">
                    {labels.recoveryCodesLeft.replace(':count', twoFactor.recoveryCodesLeft)}
                    {twoFactor.required && ` · ${labels.twoFactorRequiredNote}`}
                </p>
            )}
            {twoFactor.newRecoveryCodes && (
                <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-600">{labels.newRecoveryCodes}</p>
                    <RecoveryCodes codes={twoFactor.newRecoveryCodes} copyLabel={labels.copyCodes} />
                </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
                {twoFactor.enabled ? (
                    <>
                        {!twoFactor.required && (
                            <Button variant="outline" tone="danger" onClick={() => setDisabling(true)}>
                                {labels.disableTwoFactor}
                            </Button>
                        )}
                        <Button variant="outline" disabled={regenerate.processing} onClick={() => regenerate.post(twoFactor.regenerateUrl, { preserveScroll: true })}>
                            {labels.regenerateCodes}
                        </Button>
                        <Link href={twoFactor.renewUrl} className="inline-flex items-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-zinc-700 hover:bg-zinc-50">
                            {labels.renewTwoFactor}
                        </Link>
                    </>
                ) : (
                    <Link href={twoFactor.setupUrl} className="inline-flex items-center rounded-md bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-white hover:bg-brand-600">
                        {labels.enableTwoFactor}
                    </Link>
                )}
            </div>
            {disabling && (
                <FormDialog title={labels.disableTwoFactor} submitLabel={labels.disableTwoFactor} processing={disable.processing} onSubmit={submitDisable} onClose={() => setDisabling(false)}>
                    <p className="text-zinc-600">{labels.disableConfirm}</p>
                    <FormField stacked label={labels.currentPassword} htmlFor="two-factor-password" error={disable.errors.current_password}>
                        <PasswordInput id="two-factor-password" autoFocus autoComplete="current-password" value={disable.data.current_password} onChange={(event) => disable.setData('current_password', event.target.value)} />
                    </FormField>
                </FormDialog>
            )}
        </section>
    )
}

/**
 * The signed-in user's profile (`Panel::profile()`): details (photo, name, email), the password, with
 * `->login(twoFactor: ...)` two-factor, each its own form; and with `->notifications(live: true)` the bell's switches.
 */
export default function Profile({ labels, profile, withAvatar, emailEditable = true, updateUrl, passwordUrl, twoFactor }) {
    const details = useForm({ _method: 'put', name: profile.name ?? '', email: profile.email ?? '', avatar: null, remove_avatar: false })
    const password = useForm({ current_password: '', password: '', password_confirmation: '' })
    const { panel, auth } = usePage().props

    function saveDetails(event) {
        event.preventDefault()
        details.post(updateUrl, { forceFormData: true, preserveScroll: true, onSuccess: () => details.setData((data) => ({ ...data, avatar: null, remove_avatar: false })) })
    }

    function savePassword(event) {
        event.preventDefault()
        password.put(passwordUrl, { preserveScroll: true, onSuccess: () => password.reset() })
    }

    return (
        <>
            <Head title={labels.title} />
            <PageHeader title={labels.title} />
            <form onSubmit={saveDetails} className="mt-4 space-y-3">
                <Heading>{labels.details}</Heading>
                {withAvatar && <AvatarField labels={labels} current={profile.avatar} hasAvatar={profile.hasAvatar} name={details.data.name} form={details} />}
                <FormField label={labels.name} htmlFor="profile-name" error={details.errors.name}>
                    <Input id="profile-name" value={details.data.name} onChange={(event) => details.setData('name', event.target.value)} autoComplete="name" />
                </FormField>
                <FormField label={labels.email} htmlFor="profile-email" error={details.errors.email} hint={emailEditable ? null : labels.emailLocked}>
                    <Input id="profile-email" type="email" value={details.data.email} onChange={(event) => details.setData('email', event.target.value)} autoComplete="email" readOnly={!emailEditable} disabled={!emailEditable} />
                </FormField>
                <div className="flex justify-end">
                    <Button type="submit" disabled={details.processing}>
                        {labels.save}
                    </Button>
                </div>
            </form>
            <Rule />
            <form onSubmit={savePassword} className="space-y-3">
                <Heading>{labels.password}</Heading>
                <FormField label={labels.currentPassword} htmlFor="profile-current" error={password.errors.current_password}>
                    <PasswordInput id="profile-current" value={password.data.current_password} onChange={(event) => password.setData('current_password', event.target.value)} autoComplete="current-password" />
                </FormField>
                <FormField label={labels.newPassword} htmlFor="profile-password" error={password.errors.password}>
                    <PasswordInput id="profile-password" value={password.data.password} onChange={(event) => password.setData('password', event.target.value)} autoComplete="new-password" />
                </FormField>
                <FormField label={labels.confirmPassword} htmlFor="profile-confirm">
                    <PasswordInput id="profile-confirm" value={password.data.password_confirmation} onChange={(event) => password.setData('password_confirmation', event.target.value)} autoComplete="new-password" />
                </FormField>
                <div className="flex justify-end">
                    <Button type="submit" disabled={password.processing}>
                        {labels.savePassword}
                    </Button>
                </div>
            </form>
            {twoFactor && (
                <>
                    <Rule />
                    <TwoFactorSection labels={labels} twoFactor={twoFactor} />
                </>
            )}
            {panel?.notifications?.live && (
                <>
                    <Rule />
                    <NotificationPreferences url={panel.notifications.url} user={auth?.user?.id} />
                </>
            )}
        </>
    )
}

Profile.layout = (page) => <AppLayout width="3xl">{page}</AppLayout>
