import { Head } from '@inertiajs/react'

import { PageHeader, SectionGrid } from '../components/ui'
import { Buttons, Chips, Theme } from '../components/uikit/Basics'
import { Dates, Forms } from '../components/uikit/Forms'
import { Overlays, Progress } from '../components/uikit/Overlays'
import { Containers, Navs, RecordParts, Reorder } from '../components/uikit/Records'
import { Filtering, GroupedTable, Lists, Tables, TreeTableDemo } from '../components/uikit/Tables'
import { AppLayout } from '../layouts/AppLayout'

/*
 | The kit on one page: every primitive in its states, drawn in the current panel's theme. Mounted by
 | Phattarachai\Tungsten\Pages\UiKitPage. When a kit piece gains a variant, add it here.
 */

export default function UiKit({ toastUrl }) {
    return (
        <>
            <Head title="UI Kit" />
            <div className="space-y-3">
                <PageHeader title="UI Kit" description="ทุกชิ้นในชุด Tungsten ตามธีมของ panel นี้ ใช้เป็นตัวอย่างตอนสร้างหน้า" />
                <SectionGrid min="36rem">
                    <Theme />
                    <Buttons />
                    <Chips />
                    <Forms />
                </SectionGrid>
                <Tables />
                <TreeTableDemo />
                <SectionGrid min="36rem">
                    <Dates />
                    <Progress />
                </SectionGrid>
                <SectionGrid min="36rem">
                    <GroupedTable />
                    <Filtering />
                    <RecordParts />
                    <Reorder />
                    <Lists />
                    <Containers />
                    <Navs />
                    <Overlays toastUrl={toastUrl} />
                </SectionGrid>
            </div>
        </>
    )
}

UiKit.layout = (page) => <AppLayout>{page}</AppLayout>
