import { Head } from '@inertiajs/react'

import { strings } from '../../lib/strings'

/**
 * Standalone (no shell): a 403 from the panel gate aborts before the panel's shared props exist.
 */
export default function Error({ status, home }) {
    const message = strings.errors[status] ?? strings.errors[500]

    return (
        <>
            <Head title={message.title} />
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center font-sans">
                <p className="text-5xl font-bold text-brand">{status}</p>
                <h1 className="text-lg font-semibold text-zinc-900">{message.title}</h1>
                <p className="text-[0.8125rem] text-zinc-500">{message.body}</p>
                {home && (
                    <a href={home} className="mt-2 rounded-md bg-brand px-4 py-1.5 text-[0.8125rem] font-medium text-white hover:bg-brand-600">
                        {strings.backHome}
                    </a>
                )}
            </div>
        </>
    )
}
