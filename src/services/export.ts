import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDate, formatTime } from '../lib/utils'
import type { Shift, ClockRecord, User } from '../types/database'

// ─── PDF EXPORTS ────────────────────────────────────────────

export function exportScheduleToPDF(
  shifts: Shift[],
  organizationName: string,
  periodLabel: string
): void {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ShiftSync — Rooster', 14, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`${organizationName} · ${periodLabel}`, 14, 28)
  doc.setTextColor(0)

  const rows = shifts.map((s) => [
    formatDate(s.date, 'EEEE d MMM'),
    `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`,
    s.position,
    s.user?.full_name ?? 'Open dienst',
    s.published ? 'Gepubliceerd' : 'Concept',
  ])

  autoTable(doc, {
    head: [['Datum', 'Tijd', 'Functie', 'Medewerker', 'Status']],
    body: rows,
    startY: 35,
    headStyles: { fillColor: [16, 42, 67], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9 },
  })

  doc.save(`rooster-${periodLabel.replace(/\s/g, '-').toLowerCase()}.pdf`)
}

export function exportHoursToPDF(
  records: ClockRecord[],
  users: User[],
  organizationName: string,
  periodLabel: string
): void {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ShiftSync — Urenoverzicht', 14, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`${organizationName} · ${periodLabel}`, 14, 28)
  doc.setTextColor(0)

  const userMap = new Map(users.map((u) => [u.id, u]))

  const rows = records.map((r) => {
    const user = userMap.get(r.user_id)
    const hours = r.total_hours?.toFixed(2) ?? '—'
    const earnings = user && r.total_hours
      ? `€${(r.total_hours * user.hourly_rate).toFixed(2)}`
      : '—'
    return [
      user?.full_name ?? '—',
      formatDate(r.clock_in),
      formatTime(r.clock_in.slice(11, 16)),
      r.clock_out ? formatTime(r.clock_out.slice(11, 16)) : 'Nog actief',
      hours,
      earnings,
    ]
  })

  autoTable(doc, {
    head: [['Medewerker', 'Datum', 'Ingeklokt', 'Uitgeklokt', 'Uren', 'Bedrag']],
    body: rows,
    startY: 35,
    headStyles: { fillColor: [16, 42, 67], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9 },
  })

  // Totals per employee
  const totalsMap = new Map<string, { name: string; hours: number; earnings: number }>()
  for (const r of records) {
    const user = userMap.get(r.user_id)
    if (!user || !r.total_hours) continue
    const existing = totalsMap.get(r.user_id) ?? { name: user.full_name, hours: 0, earnings: 0 }
    existing.hours += r.total_hours
    existing.earnings += r.total_hours * user.hourly_rate
    totalsMap.set(r.user_id, existing)
  }

  const totalsY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  autoTable(doc, {
    head: [['Medewerker', 'Totaal uren', 'Totaal bedrag']],
    body: Array.from(totalsMap.values()).map((t) => [
      t.name,
      t.hours.toFixed(2),
      `€${t.earnings.toFixed(2)}`,
    ]),
    startY: totalsY,
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    styles: { fontSize: 9 },
  })

  doc.save(`uren-${periodLabel.replace(/\s/g, '-').toLowerCase()}.pdf`)
}

// ─── EXCEL EXPORTS ──────────────────────────────────────────

export function exportScheduleToExcel(
  shifts: Shift[],
  organizationName: string,
  periodLabel: string
): void {
  const data = [
    ['ShiftSync — Rooster Export'],
    [`Organisatie: ${organizationName}  |  Periode: ${periodLabel}`],
    [],
    ['Datum', 'Dag', 'Begintijd', 'Eindtijd', 'Functie', 'Medewerker', 'Status'],
    ...shifts.map((s) => [
      formatDate(s.date, 'yyyy-MM-dd'),
      formatDate(s.date, 'EEEE'),
      formatTime(s.start_time),
      formatTime(s.end_time),
      s.position,
      s.user?.full_name ?? 'Open dienst',
      s.published ? 'Gepubliceerd' : 'Concept',
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rooster')
  XLSX.writeFile(wb, `rooster-${periodLabel.replace(/\s/g, '-').toLowerCase()}.xlsx`)
}

export function exportHoursToExcel(
  records: ClockRecord[],
  users: User[],
  organizationName: string,
  periodLabel: string
): void {
  const userMap = new Map(users.map((u) => [u.id, u]))

  const rows = records.map((r) => {
    const user = userMap.get(r.user_id)
    return [
      user?.full_name ?? '—',
      formatDate(r.clock_in, 'yyyy-MM-dd'),
      r.clock_in ? r.clock_in.slice(11, 16) : '—',
      r.clock_out ? r.clock_out.slice(11, 16) : 'Actief',
      r.total_hours ?? 0,
      user && r.total_hours ? r.total_hours * user.hourly_rate : 0,
    ]
  })

  const data = [
    ['ShiftSync — Urenoverzicht Export'],
    [`Organisatie: ${organizationName}  |  Periode: ${periodLabel}`],
    [],
    ['Medewerker', 'Datum', 'Ingeklokt', 'Uitgeklokt', 'Uren', 'Bedrag (€)'],
    ...rows,
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Uren')
  XLSX.writeFile(wb, `uren-${periodLabel.replace(/\s/g, '-').toLowerCase()}.xlsx`)
}
