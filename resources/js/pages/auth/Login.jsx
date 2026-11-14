import { useForm } from '@inertiajs/react'

import { AuthCard, AuthLink } from '../../components/panel/AuthCard'
import { Button } from '../../components/ui/Button'
import { FormField, Input, PasswordInput } from '../../components/ui/form'
import { urlOf } from '../../lib/href'

/**
 * A panel's own sign-in page (`Panel::login()`): the brand, then one card on the canvas. Every word comes from
 * `labels` (`tungsten.login.labels` + the panel's overrides).
 */
export default function Login({ labels, action, forgotPasswordUrl }) {
    const form = useForm({ email: '', password: '', remember: false })

    function submit(event) {
        event.preventDefault()
        form.post(urlOf(action), { onFinish: () => form.reset('password') })
    }

    return (
        <AuthCard title={labels.title} intro={labels.intro} onSubmit={submit}>
            <FormField stacked label={labels.email} htmlFor="login-email" error={form.errors.email}>
                <Input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    value={form.data.email}
                    onChange={(event) => form.setData('email', event.target.value)}
                    aria-invalid={Boolean(form.errors.email)}
                />
            </FormField>
            <FormField stacked label={labels.password} htmlFor="login-password" error={form.errors.password}>
                <PasswordInput
                    id="login-password"
                    autoComplete="current-password"
                    value={form.data.password}
                    onChange={(event) => form.setData('password', event.target.value)}
                    aria-invalid={Boolean(form.errors.password)}
                />
            </FormField>
            <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-1.5 text-zinc-600">
                    <input type="checkbox" checked={form.data.remember} onChange={(event) => form.setData('remember', event.target.checked)} className="accent-brand" />
                    {labels.remember}
                </label>
                {forgotPasswordUrl && <AuthLink href={forgotPasswordUrl}>{labels.forgot}</AuthLink>}
            </div>
            <Button type="submit" variant="brand" className="w-full" disabled={form.processing}>
                {labels.submit}
            </Button>
        </AuthCard>
    )
}
