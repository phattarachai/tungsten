import { Columns3 } from 'lucide-react'

import { Dropdown, DropdownOption, DropdownSection } from './Dropdown'
import { strings } from '../../lib/strings'

export function ColumnsMenu({ columns, visibility }) {
    const toggleable = columns.filter((column) => column.toggleable)

    return (
        <Dropdown icon={Columns3} title={strings.toggleColumns} align="right" width="w-56">
            <DropdownSection title={strings.columns}>
                <div className="max-h-80 overflow-y-auto">
                    {toggleable.map((column) => (
                        <DropdownOption key={column.key} selected={!visibility.hidden.includes(column.key)} onSelect={() => visibility.toggle(column.key)}>
                            {column.menuLabel ?? column.label}
                        </DropdownOption>
                    ))}
                </div>
            </DropdownSection>
            <DropdownSection>
                <DropdownOption onSelect={visibility.reset}>{strings.resetColumns}</DropdownOption>
            </DropdownSection>
        </Dropdown>
    )
}
