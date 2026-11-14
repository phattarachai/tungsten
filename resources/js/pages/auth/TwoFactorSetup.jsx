import { useForm } from '@inertiajs/react'

import { AuthCard, AuthLink } from '../../components/panel/AuthCard'
import { RecoveryCodes } from '../../components/panel/RecoveryCodes'
import { Button } from '../../components/ui/Button'
import { FormField, Input } from '../../components/ui/form'
import { urlOf } from '../../lib/href'

function Codes({ labels, recoveryCodes, continueUrl }) {
    return (
        <AuthCard title={labels.recoveryCodesTitle} intro={labels.recoveryCodesIntro} width="max-w-sm">
            <RecoveryCodes codes={recoveryCodes} copyLabel={labels.copyCodes} />
            <a href={urlOf(continueUrl)} className="flex w-full items-center justify-center rounded-md bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-white hover:bg-brand-600">
                {labels.continue}
            </a>
        </AuthCard>
    )
}

/**
 * `{path}/two-factor/setup`: scan the QR (or type the key), confirm with a code, then the recovery codes, shown once.
 * A user who must use two-factor is held here at their first sign-in, with only a way to sign out; `renew` moves an
 * enrolled user to a new phone.
 */
export default function TwoFactorSetup({ labels, recoveryCodes, continueUrl, renew, required, qr, secret, action, logoutUrl, cancelUrl }) {
    const form = useForm({ code: '' })

    if (recoveryCodes) {
        return <Codes labels={labels} recoveryCodes={recoveryCodes} continueUrl={continueUrl} />
    }

    function submit(event) {
        event.preventDefault()
        form.post(urlOf(action), { onFinish: () => form.reset('code') })
    }

    const footer = cancelUrl ? (
        <AuthLink href={cancelUrl}>{labels.cancel}</AuthLink>
    ) : (
        <AuthLink href={logoutUrl} method="post">
            {labels.logout}
        </AuthLink>
    )

    return (
        <AuthCard title={labels.setupTitle} intro={renew ? labels.setupRenewIntro : required ? labels.setupIntro : null} onSubmit={submit} footer={footer} width="max-w-sm">
            <p className="text-zinc-600">{labels.setupScan}</p>
            <div className="flex justify-center">
                <div className="size-48 rounded-md border border-zinc-200 bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
            </div>
            <div className="space-y-1 text-center">
                <p className="text-zinc-500">{labels.setupManual}</p>
                <p className="font-mono text-[0.8125rem] break-all text-zinc-800 select-all">{secret}</p>
            </div>
            <FormField stacked label={labels.setupConfirm} htmlFor="setup-code" error={form.errors.code}>
                <Input
                    id="setup-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={form.data.code}
                    onChange={(event) => form.setData('code', event.target.value.replace(/\D/g, ''))}
                    aria-invalid={Boolean(form.errors.code)}
                    className="text-center font-mono text-base tracking-[0.4em]"
                />
            </FormField>
            <Button type="submit" variant="brand" className="w-full" disabled={form.processing}>
                {labels.setupSubmit}
            </Button>
        </AuthCard>
    )
}
