import { useId } from 'react'

import { Button } from './Button'
import { Dialog } from './Dialog'
import { strings } from '../../lib/strings'

export function FormDialog({ title, submitLabel = strings.save, processing = false, onSubmit, onClose, className = 'max-w-md', children }) {
    const formId = useId()

    function submit(event) {
        event.preventDefault()
        event.stopPropagation()
        onSubmit()
    }

    return (
        <Dialog
            open
            dismissible={false}
            onClose={onClose}
            title={title}
            className={className}
            footer={
                <>
                    <Button size="sm" variant="outline" onClick={onClose}>
                        {strings.cancel}
                    </Button>
                    <Button size="sm" type="submit" form={formId} disabled={processing}>
                        {submitLabel}
                    </Button>
                </>
            }
        >
            <form id={formId} onSubmit={submit} className="space-y-3">
                {children}
            </form>
        </Dialog>
    )
}
