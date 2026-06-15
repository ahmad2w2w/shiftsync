import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { formatDate, formatTime, leaveStatusLabel, sickStatusLabel } from '../lib/utils'
import { shiftHours } from '../lib/plannerEngine'
import type { Shift, ClockRecord, User, ShiftStatus, LeaveRequest, SickReport } from '../types/database'

export interface ScheduleExportOptions {
  shifts: Shift[]
  organizationName: string
  periodLabel: string
  employees?: User[]
  exportedAt?: Date
}

const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  scheduled: 'Gepland',
  completed: 'Afgerond',
  cancelled: 'Geannuleerd',
}

const DETAIL_HEADERS = [
  'Datum',
  'Dag',
  'Start',
  'Eind',
  'Uren',
  'Afdeling',
  'Medewerker',
  'E-mail',
  'Functie',
  'Type',
  'Dienststatus',
  'Publicatie',
  'Uurloon (€)',
  'Loonkosten (€)',
] as const

function rateMapFromEmployees(employees?: User[]) {
  return new Map((employees ?? []).map((u) => [u.id, Number(u.hourly_rate) || 0]))
}

function buildDetailRows(shifts: Shift[], employees?: User[]) {
  const rates = rateMapFromEmployees(employees)
  const sorted = [...shifts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
  )

  return sorted.map((s) => {
    const hours = shiftHours(s.start_time, s.end_time)
    const rate = s.user_id ? rates.get(s.user_id) ?? 0 : 0
    const cost = s.user_id ? hours * rate : 0
    return [
      formatDate(s.date, 'yyyy-MM-dd'),
      formatDate(s.date, 'EEEE'),
      formatTime(s.start_time),
      formatTime(s.end_time),
      hours.toFixed(2),
      s.position,
      s.user?.full_name ?? 'Open dienst',
      s.user?.email ?? '—',
      s.user?.primary_position ?? '—',
      s.user_id ? 'Ingepland' : 'Open dienst',
      SHIFT_STATUS_LABELS[s.status] ?? s.status,
      s.published ? 'Gepubliceerd' : 'Concept',
      s.user_id ? rate.toFixed(2) : '—',
      s.user_id ? cost.toFixed(2) : '—',
    ]
  })
}

function buildEmployeeSummary(shifts: Shift[], employees?: User[]) {
  const rates = rateMapFromEmployees(employees)
  const byUser = new Map<string, { name: string; shifts: number; hours: number; cost: number }>()

  for (const s of shifts) {
    if (!s.user_id) continue
    const hours = shiftHours(s.start_time, s.end_time)
    const rate = rates.get(s.user_id) ?? 0
    const existing = byUser.get(s.user_id) ?? {
      name: s.user?.full_name ?? 'Medewerker',
      shifts: 0,
      hours: 0,
      cost: 0,
    }
    existing.shifts += 1
    existing.hours += hours
    existing.cost += hours * rate
    byUser.set(s.user_id, existing)
  }

  return Array.from(byUser.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => [row.name, row.shifts, row.hours.toFixed(2), row.cost.toFixed(2)])
}

function buildOverviewRows(opts: ScheduleExportOptions) {
  const { shifts, organizationName, periodLabel, exportedAt = new Date() } = opts
  const totalHours = shifts.reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0)
  const assigned = shifts.filter((s) => s.user_id)
  const open = shifts.filter((s) => !s.user_id)
  const published = shifts.filter((s) => s.published)
  const draft = shifts.filter((s) => !s.published)
  const totalCost = buildEmployeeSummary(shifts, opts.employees).reduce(
    (sum, row) => sum + Number(row[3]),
    0
  )

  return [
    ['ShiftSync — Rooster export'],
    ['Organisatie', organizationName],
    ['Periode', periodLabel],
    ['Geëxporteerd op', format(exportedAt, 'd MMM yyyy HH:mm')],
    [],
    ['Totaal diensten', shifts.length],
    ['Ingeplande diensten', assigned.length],
    ['Open diensten', open.length],
    ['Gepubliceerd', published.length],
    ['Concept', draft.length],
    ['Totaal geplande uren', totalHours.toFixed(2)],
    ['Geschatte loonkosten (€)', totalCost.toFixed(2)],
  ]
}

function safeFileLabel(label: string) {
  return label.replace(/[^\w\-]+/g, '-').toLowerCase()
}

// ─── PDF EXPORTS ────────────────────────────────────────────

export function exportScheduleToPDF(opts: ScheduleExportOptions): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const exportedAt = opts.exportedAt ?? new Date()

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ShiftSync — Rooster', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80)
  doc.text(
    `${opts.organizationName} · ${opts.periodLabel} · geëxporteerd ${format(exportedAt, 'd MMM yyyy HH:mm')}`,
    14,
    23
  )
  doc.setTextColor(0)

  const detailRows = buildDetailRows(opts.shifts, opts.employees)

  autoTable(doc, {
    head: [DETAIL_HEADERS as unknown as string[]],
    body: detailRows,
    startY: 28,
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 7, cellPadding: 1.5 },
    margin: { left: 14, right: 14 },
  })

  const summary = buildEmployeeSummary(opts.shifts, opts.employees)
  if (summary.length > 0) {
    const y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Samenvatting per medewerker', 14, y)

    autoTable(doc, {
      head: [['Medewerker', 'Diensten', 'Totaal uren', 'Loonkosten (€)']],
      body: summary,
      startY: y + 4,
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
  }

  const overview = buildOverviewRows(opts).filter((row) => row.length > 0)
  const overviewY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Overzicht', 14, overviewY)

  autoTable(doc, {
    body: overview.slice(4),
    startY: overviewY + 4,
    theme: 'plain',
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    margin: { left: 14, right: 14 },
  })

  doc.save(`rooster-${safeFileLabel(opts.periodLabel)}.pdf`)
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

  doc.save(`uren-${safeFileLabel(periodLabel)}.pdf`)
}

// ─── EXCEL EXPORTS ──────────────────────────────────────────

export function exportScheduleToExcel(opts: ScheduleExportOptions): void {
  const detailRows = buildDetailRows(opts.shifts, opts.employees)
  const summaryRows = buildEmployeeSummary(opts.shifts, opts.employees)
  const overviewRows = buildOverviewRows(opts)

  const detailSheet = XLSX.utils.aoa_to_sheet([
    ['ShiftSync — Rooster export'],
    [`Organisatie: ${opts.organizationName}  |  Periode: ${opts.periodLabel}`],
    [],
    [...DETAIL_HEADERS],
    ...detailRows,
  ])
  detailSheet['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 14 }, { wch: 22 }, { wch: 26 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Samenvatting per medewerker'],
    [],
    ['Medewerker', 'Diensten', 'Totaal uren', 'Loonkosten (€)'],
    ...summaryRows,
  ])
  summarySheet['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 14 }]

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows)
  overviewSheet['!cols'] = [{ wch: 28 }, { wch: 24 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Diensten')
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Per medewerker')
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overzicht')
  XLSX.writeFile(wb, `rooster-${safeFileLabel(opts.periodLabel)}.xlsx`)
}

// ─── LEAVE & SICK EXPORTS ───────────────────────────────────

const LEAVE_HEADERS = ['Medewerker', 'Startdatum', 'Einddatum', 'Type', 'Uren', 'Status', 'Reden', 'Opmerking'] as const

function buildLeaveRows(requests: LeaveRequest[]) {
  return [...requests]
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((r) => [
      r.user?.full_name ?? '—',
      formatDate(r.start_date, 'yyyy-MM-dd'),
      formatDate(r.end_date, 'yyyy-MM-dd'),
      r.leave_type?.name ?? '—',
      r.hours != null ? Number(r.hours).toFixed(1) : '—',
      leaveStatusLabel[r.status] ?? r.status,
      r.reason ?? '—',
      r.manager_note ?? '',
    ])
}

const SICK_HEADERS = ['Medewerker', 'Startdatum', 'Einddatum', 'Status', 'Toelichting'] as const

function buildSickRows(reports: SickReport[]) {
  return [...reports]
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((r) => [
      r.user?.full_name ?? '—',
      formatDate(r.start_date, 'yyyy-MM-dd'),
      r.end_date ? formatDate(r.end_date, 'yyyy-MM-dd') : '—',
      sickStatusLabel[r.status] ?? r.status,
      r.note ?? '',
    ])
}

export function exportLeaveToExcel(requests: LeaveRequest[], organizationName: string, periodLabel: string): void {
  const ws = XLSX.utils.aoa_to_sheet([
    ['ShiftSync — Verlof export'],
    [`Organisatie: ${organizationName}  |  ${periodLabel}`],
    [],
    [...LEAVE_HEADERS],
    ...buildLeaveRows(requests),
  ])
  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 26 }, { wch: 26 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Verlof')
  XLSX.writeFile(wb, `verlof-${safeFileLabel(periodLabel)}.xlsx`)
}

export function exportLeaveToPDF(requests: LeaveRequest[], organizationName: string, periodLabel: string): void {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ShiftSync — Verlofoverzicht', 14, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`${organizationName} · ${periodLabel}`, 14, 25)
  doc.setTextColor(0)
  autoTable(doc, {
    head: [LEAVE_HEADERS as unknown as string[]],
    body: buildLeaveRows(requests),
    startY: 31,
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8 },
  })
  doc.save(`verlof-${safeFileLabel(periodLabel)}.pdf`)
}

export function exportSickToExcel(reports: SickReport[], organizationName: string, periodLabel: string): void {
  const ws = XLSX.utils.aoa_to_sheet([
    ['ShiftSync — Ziekteverzuim export'],
    [`Organisatie: ${organizationName}  |  ${periodLabel}`],
    [],
    [...SICK_HEADERS],
    ...buildSickRows(reports),
  ])
  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 30 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ziekte')
  XLSX.writeFile(wb, `ziekte-${safeFileLabel(periodLabel)}.xlsx`)
}

export function exportSickToPDF(reports: SickReport[], organizationName: string, periodLabel: string): void {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ShiftSync — Ziekteverzuim', 14, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`${organizationName} · ${periodLabel}`, 14, 25)
  doc.setTextColor(0)
  autoTable(doc, {
    head: [SICK_HEADERS as unknown as string[]],
    body: buildSickRows(reports),
    startY: 31,
    headStyles: { fillColor: [217, 119, 6], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8 },
  })
  doc.save(`ziekte-${safeFileLabel(periodLabel)}.pdf`)
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
  XLSX.writeFile(wb, `uren-${safeFileLabel(periodLabel)}.xlsx`)
}
