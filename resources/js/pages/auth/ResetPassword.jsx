import { useForm } from '@inertiajs/react'

import { AuthCard, AuthLink } from '../../components/panel/AuthCard'
import { Button } from '../../components/ui/Button'
import { FormField, Input, PasswordInput } from '../../components/ui/form'
import { urlOf } from '../../lib/href'

/**
 * `{path}/reset-password/{token}`, from the reset mail: the email (filled in from the link) and the new password twice.
 * An expired or used link comes back as an error on `email`, with the way to ask for a new one.
 */
export default function ResetPassword({ labels, action, token, email, forgotUrl }) {
    const form = useForm({ token, email: email ?? '', password: '', password_confirmation: '' })

    function submit(event) {
        event.preventDefault()
        form.post(urlOf(action), { onFinish: () => form.reset('password', 'password_confirmation') })
    }

    return (
        <AuthCard title={labels.resetTitle} onSubmit={submit} footer={forgotUrl && <AuthLink href={forgotUrl}>{labels.forgotTitle}</AuthLink>}>
            <FormField stacked label={labels.email} htmlFor="reset-email" error={form.errors.email}>
                <Input id="reset-email" type="email" autoComplete="username" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} aria-invalid={Boolean(form.errors.email)} />
            </FormField>
            <FormField stacked label={labels.newPassword} htmlFor="reset-password" error={form.errors.password}>
                <PasswordInput
                    id="reset-password"
                    autoComplete="new-password"
                    autoFocus
                    value={form.data.password}
                    onChange={(event) => form.setData('password', event.target.value)}
                    aria-invalid={Boolean(form.errors.password)}
                />
            </FormField>
            <FormField stacked label={labels.confirmPassword} htmlFor="reset-confirm">
                <PasswordInput id="reset-confirm" autoComplete="new-password" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} />
            </FormField>
            <Button type="submit" variant="brand" className="w-full" disabled={form.processing}>
                {labels.resetSubmit}
            </Button>
        </AuthCard>
    )
}
