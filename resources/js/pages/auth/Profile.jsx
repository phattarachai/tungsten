import { Head, useForm } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'

import { Avatar } from '../../components/panel/Avatar'
import { Button } from '../../components/ui/Button'
import { FormField, Input } from '../../components/ui/form'
import { PageHeader } from '../../components/ui/PageHeader'
import { Heading, Rule } from '../../components/ui/RecordParts'
import { AppLayout } from '../../layouts/AppLayout'

/** The photo with a file picker; the preview is the picked file until it's saved. */
function AvatarField({ labels, current, name, form }) {
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
                {shown && (
                    <Button variant="ghost" tone="danger" size="sm" onClick={() => form.setData((data) => ({ ...data, avatar: null, remove_avatar: true }))}>
                        {labels.removeAvatar}
                    </Button>
                )}
            </div>
        </FormField>
    )
}

/**
 * The signed-in user's profile (`Panel::profile()`): details (photo, name, email) and the password, each its own form.
 */
export default function Profile({ labels, profile, withAvatar, updateUrl, passwordUrl }) {
    const details = useForm({ _method: 'put', name: profile.name ?? '', email: profile.email ?? '', avatar: null, remove_avatar: false })
    const password = useForm({ current_password: '', password: '', password_confirmation: '' })

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
                {withAvatar && <AvatarField labels={labels} current={profile.avatar} name={details.data.name} form={details} />}
                <FormField label={labels.name} htmlFor="profile-name" error={details.errors.name}>
                    <Input id="profile-name" value={details.data.name} onChange={(event) => details.setData('name', event.target.value)} autoComplete="name" />
                </FormField>
                <FormField label={labels.email} htmlFor="profile-email" error={details.errors.email}>
                    <Input id="profile-email" type="email" value={details.data.email} onChange={(event) => details.setData('email', event.target.value)} autoComplete="email" />
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
                    <Input id="profile-current" type="password" value={password.data.current_password} onChange={(event) => password.setData('current_password', event.target.value)} autoComplete="current-password" />
                </FormField>
                <FormField label={labels.newPassword} htmlFor="profile-password" error={password.errors.password}>
                    <Input id="profile-password" type="password" value={password.data.password} onChange={(event) => password.setData('password', event.target.value)} autoComplete="new-password" />
                </FormField>
                <FormField label={labels.confirmPassword} htmlFor="profile-confirm">
                    <Input id="profile-confirm" type="password" value={password.data.password_confirmation} onChange={(event) => password.setData('password_confirmation', event.target.value)} autoComplete="new-password" />
                </FormField>
                <div className="flex justify-end">
                    <Button type="submit" disabled={password.processing}>
                        {labels.savePassword}
                    </Button>
                </div>
            </form>
        </>
    )
}

Profile.layout = (page) => <AppLayout width="3xl">{page}</AppLayout>
