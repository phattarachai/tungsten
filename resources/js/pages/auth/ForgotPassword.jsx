import { useForm } from '@inertiajs/react'

import { AuthCard, AuthLink } from '../../components/panel/AuthCard'
import { Button } from '../../components/ui/Button'
import { FormField, Input } from '../../components/ui/form'
import { urlOf } from '../../lib/href'

/**
 * `{path}/forgot-password` (`->login(passwordReset: true)`): one email field. The answer reads the same whether or not
 * the email has an account; it comes back as the flashed `status`.
 */
export default function ForgotPassword({ labels, action, loginUrl }) {
    const form = useForm({ email: '' })

    function submit(event) {
        event.preventDefault()
        form.post(urlOf(action), { preserveScroll: true })
    }

    return (
        <AuthCard title={labels.forgotTitle} intro={labels.forgotIntro} onSubmit={submit} footer={loginUrl && <AuthLink href={loginUrl}>{labels.backToLogin}</AuthLink>}>
            <FormField stacked label={labels.email} htmlFor="forgot-email" error={form.errors.email}>
                <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    value={form.data.email}
                    onChange={(event) => form.setData('email', event.target.value)}
                    aria-invalid={Boolean(form.errors.email)}
                />
            </FormField>
            <Button type="submit" variant="brand" className="w-full" disabled={form.processing}>
                {labels.sendLink}
            </Button>
        </AuthCard>
    )
}
