import { useForm } from '@inertiajs/react'
import { useState } from 'react'

import { AuthCard, AuthLink } from '../../components/panel/AuthCard'
import { Button } from '../../components/ui/Button'
import { FormField, Input } from '../../components/ui/form'
import { urlOf } from '../../lib/href'

/**
 * `{path}/two-factor-challenge` (`->login(twoFactor: ...)`): the 6-digit code from the authenticator app, or a recovery
 * code instead. `logoutUrl` is set when someone is already signed in (another login on the same guard), so they can
 * leave; otherwise the way back is the login page.
 */
export default function TwoFactorChallenge({ labels, action, loginUrl, logoutUrl }) {
    const [recovery, setRecovery] = useState(false)
    const form = useForm({ code: '', recovery_code: '' })

    function submit(event) {
        event.preventDefault()
        form.post(urlOf(action), { onFinish: () => form.reset('code', 'recovery_code') })
    }

    function toggle() {
        form.clearErrors()
        form.reset('code', 'recovery_code')
        setRecovery((value) => !value)
    }

    const back = logoutUrl ? (
        <AuthLink href={logoutUrl} method="post">
            {labels.logout}
        </AuthLink>
    ) : (
        loginUrl && <AuthLink href={loginUrl}>{labels.backToLogin}</AuthLink>
    )

    return (
        <AuthCard title={labels.challengeTitle} intro={recovery ? labels.recoveryIntro : labels.challengeIntro} onSubmit={submit} footer={back}>
            {recovery ? (
                <FormField stacked label={labels.recoveryCode} htmlFor="challenge-recovery" error={form.errors.recovery_code}>
                    <Input
                        id="challenge-recovery"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoFocus
                        value={form.data.recovery_code}
                        onChange={(event) => form.setData('recovery_code', event.target.value)}
                        aria-invalid={Boolean(form.errors.recovery_code)}
                        className="font-mono"
                    />
                </FormField>
            ) : (
                <FormField stacked label={labels.code} htmlFor="challenge-code" error={form.errors.code}>
                    <Input
                        id="challenge-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        autoFocus
                        value={form.data.code}
                        onChange={(event) => form.setData('code', event.target.value.replace(/\D/g, ''))}
                        aria-invalid={Boolean(form.errors.code)}
                        className="text-center font-mono text-base tracking-[0.4em]"
                    />
                </FormField>
            )}
            <Button type="submit" variant="brand" className="w-full" disabled={form.processing}>
                {labels.verify}
            </Button>
            <div className="text-center">
                <AuthLink onClick={toggle}>{recovery ? labels.useCode : labels.useRecoveryCode}</AuthLink>
            </div>
        </AuthCard>
    )
}
