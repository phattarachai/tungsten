import { Head, useForm, usePage } from '@inertiajs/react'

import { PanelChip } from '../../components/panel/PanelChip'
import { Button } from '../../components/ui/Button'
import { FormField, Input } from '../../components/ui/form'
import { urlOf } from '../../lib/href'

function Brand({ panel }) {
    const brand = panel?.brand

    return (
        <div className="mb-4 flex items-center justify-center gap-2">
            <PanelChip entry={{ color: panel?.color, short: panel?.short, icon: brand?.icon ?? panel?.icon }} className="size-7 text-[0.6875rem]" />
            <span className="text-[0.9375rem] font-semibold text-zinc-900">{brand?.label ?? panel?.label}</span>
            {brand?.tag && <span className="rounded bg-zinc-200 px-1 text-[0.625rem] leading-4 font-semibold text-zinc-500">{brand.tag}</span>}
        </div>
    )
}

/**
 * A panel's own sign-in page (`Panel::login()`): the brand, then one card on the canvas. Every word comes from
 * `labels` (`tungsten.login.labels` + the panel's overrides).
 */
export default function Login({ labels, action, forgotPasswordUrl }) {
    const { panel, flash } = usePage().props
    const form = useForm({ email: '', password: '', remember: false })

    function submit(event) {
        event.preventDefault()
        form.post(urlOf(action), { onFinish: () => form.reset('password') })
    }

    return (
        <div className="panel-shell flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10 text-xs text-zinc-800">
            <Head title={labels.title} />
            <div className="w-full max-w-xs">
                <Brand panel={panel} />
                <form onSubmit={submit} className="space-y-3 rounded-lg border border-sheet-line bg-sheet p-5 shadow-sm" noValidate>
                    <div className="space-y-1">
                        <h1 className="text-[0.9375rem] font-semibold text-zinc-900">{labels.title}</h1>
                        {labels.intro && <p className="text-zinc-500">{labels.intro}</p>}
                    </div>
                    {flash?.status && <p className="rounded-md bg-zinc-100 px-3 py-2 text-zinc-700">{flash.status}</p>}
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
                        <Input
                            id="login-password"
                            type="password"
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
                        {forgotPasswordUrl && (
                            <a href={forgotPasswordUrl} className="text-zinc-500 hover:text-brand hover:underline">
                                {labels.forgot}
                            </a>
                        )}
                    </div>
                    <Button type="submit" variant="brand" className="w-full" disabled={form.processing}>
                        {labels.submit}
                    </Button>
                </form>
            </div>
        </div>
    )
}
