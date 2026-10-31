import { Button } from './Button'
import { Dialog } from './Dialog'
import { strings } from '../../lib/strings'

export function ConfirmDialog({ open, title, confirmLabel = strings.confirm, tone = 'brand', processing = false, onConfirm, onClose, children }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            className="max-w-sm"
            footer={
                <>
                    <Button size="sm" variant="outline" onClick={onClose}>
                        {onConfirm ? strings.cancel : strings.close}
                    </Button>
                    {onConfirm && (
                        <Button size="sm" variant={tone} onClick={onConfirm} disabled={processing}>
                            {confirmLabel}
                        </Button>
                    )}
                </>
            }
        >
            <div className="text-[0.8125rem] text-zinc-700">{children}</div>
        </Dialog>
    )
}
