import { useState } from 'react'

import { Checkbox, Combobox, DatePicker, DateRangePicker, DateTimePicker, FormField, Input, PasswordInput, RadioGroup, Section, Select, Textarea } from '../ui'
import { swatch } from './shared'

const KEEP = [
    { value: 'a', label: 'เกศินี วงศ์ใหญ่ #1024', description: 'สมัครก่อน · 12 คำสั่งซื้อ · 1,240 แต้ม' },
    { value: 'b', label: 'เกศินี ว. #2981', description: 'สมัครจาก LINE · 1 คำสั่งซื้อ' },
    { value: 'c', label: 'บัญชีที่ปิดแล้ว #77', description: 'เลือกไม่ได้', disabled: true },
]

const PEOPLE = [
    { value: 'c-1', label: 'เกศินี วงศ์ใหญ่', avatar: swatch('#be185d', 'ก'), meta: '081-xxx-1234' },
    { value: 'c-2', label: 'สมชาย มั่นคง', avatar: null, meta: '089-xxx-5678' },
    { value: 'c-3', label: 'Wanida P.', avatar: null, meta: '062-xxx-9012' },
]

const OPTIONS = [
    { value: 'vitamin', label: 'วิตามิน' },
    { value: 'beauty', label: 'ความงาม' },
    { value: 'supplies', label: 'ของใช้' },
    { value: 'herbal', label: 'สมุนไพร' },
]

export function Forms() {
    const [customer, setCustomer] = useState('c-1')
    const [keep, setKeep] = useState('a')
    const [delivery, setDelivery] = useState('ship')
    const [confirmed, setConfirmed] = useState(false)
    const [category, setCategory] = useState('vitamin')
    const [categories, setCategories] = useState(['vitamin', 'beauty'])

    return (
        <Section id="forms" title="ฟอร์ม" hint="label อยู่ซ้าย · stacked เฉพาะช่องที่ต้องกว้าง">
            <div className="space-y-2.5">
                <FormField label="ชื่อสินค้า" htmlFor="kit-name">
                    <Input id="kit-name" defaultValue="วิตามินซี 1000" />
                </FormField>
                <FormField label="รหัสผ่าน" htmlFor="kit-password" hint="ปุ่มรูปตาแสดง / ซ่อนรหัสผ่าน">
                    <PasswordInput id="kit-password" defaultValue="secret-password" autoComplete="off" />
                </FormField>
                <FormField label="ราคา" hint="บาท" info="ราคาที่ลูกค้าเห็นก่อนส่วนลด">
                    <Input defaultValue="390.00" className="tabular-nums" />
                </FormField>
                <FormField label="การจัดส่ง">
                    <Select defaultValue="fixed">
                        <option value="fixed">ส่งพัสดุ</option>
                        <option value="reference">รับที่ร้าน</option>
                    </Select>
                </FormField>
                <FormField label="หมวด">
                    <Combobox options={OPTIONS} value={category} onChange={setCategory} />
                </FormField>
                <FormField label="ลูกค้า" hint="option มี avatar: รูป หรือตัวอักษรแรก">
                    <Combobox options={PEOPLE} value={customer} onChange={setCustomer} clearable />
                </FormField>
                <FormField label="เก็บข้อมูลของ" info="RadioGroup layout=list">
                    <RadioGroup options={KEEP} value={keep} onChange={setKeep} aria-label="เก็บข้อมูลของ" />
                </FormField>
                <FormField label="การจัดส่ง" info="RadioGroup layout=cards">
                    <RadioGroup
                        layout="cards"
                        options={[
                            { value: 'ship', label: 'ส่งพัสดุ', description: 'Kerry · 1–2 วัน' },
                            { value: 'pickup', label: 'รับที่ร้าน', description: 'สาขาลาดพร้าว' },
                        ]}
                        value={delivery}
                        onChange={setDelivery}
                        aria-label="การจัดส่ง"
                    />
                </FormField>
                <FormField label="ยืนยัน">
                    <Checkbox checked={confirmed} onChange={setConfirmed} label="รวมลูกค้าทั้งสองบัญชี" hint="ย้อนกลับไม่ได้" error={confirmed ? null : 'ต้องยืนยันก่อนรวม'} />
                </FormField>
                <FormField label="หมวด หลายค่า">
                    <Combobox options={OPTIONS} value={categories} onChange={setCategories} multiple clearable />
                </FormField>
                <FormField label="รหัสลูกค้า" error="ไม่พบลูกค้า C-99999">
                    <Input defaultValue="C-99999" aria-invalid />
                </FormField>
                <FormField label="หมายเหตุ" stacked>
                    <Textarea rows={2} defaultValue="ส่งก่อนเที่ยง ติดต่อหน้าร้าน" />
                </FormField>
            </div>
        </Section>
    )
}

export function Dates() {
    const [date, setDate] = useState('2026-10-19')
    const [dateTime, setDateTime] = useState('')
    const [range, setRange] = useState({ start: '2026-10-01', end: '2026-10-31' })

    return (
        <Section id="dates" title="DatePicker · พ.ศ." hint="ค่าเป็น ISO ค.ศ. · แสดงเป็น พ.ศ.">
            <div className="space-y-2.5">
                <FormField label="วันที่">
                    <DatePicker value={date} onChange={setDate} clearable />
                </FormField>
                <FormField label="วันที่ เวลา">
                    <DateTimePicker value={dateTime} onChange={setDateTime} clearable />
                </FormField>
                <FormField label="ช่วงวันที่">
                    <DateRangePicker start={range.start} end={range.end} onChange={setRange} clearable />
                </FormField>
            </div>
        </Section>
    )
}
