import { RefreshCw } from 'lucide-react'

import { ActionMenu } from './ActionMenu'
import { Button } from './Button'

export function SyncButton({ label, items, ...props }) {
    if (items) {
        return <ActionMenu label={label} icon={RefreshCw} iconClassName="" items={items} />
    }

    return (
        <Button size="sm" variant="outline" {...props}>
            <RefreshCw className="size-3.5" />
            {label}
        </Button>
    )
}
