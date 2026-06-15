import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { useOrganization } from '../../context/OrganizationContext'
import { exportScheduleToExcel, exportScheduleToPDF } from '../../services/export'
import { getShiftsForPeriod } from '../../services/shifts'
import { clearMonthSchedule } from '../../services/monthPlanner'
import type { Shift, User } from '../../types/database'
import { Dropdown } from '../ui/Dropdown'
import { useConfirm } from '../../context/ConfirmContext'

interface ScheduleActionsMenuProps {
  shifts: Shift[]
  employees: User[]
  organizationName: string
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  monthAnchor: Date
  onPublish: () => void
  onCleared: () => Promise<void>
}

export function ScheduleActionsMenu({
  shifts,
  employees,
  organizationName,
  periodLabel,
  periodStart,
  periodEnd,
  monthAnchor,
  onPublish,
  onCleared,
}: ScheduleActionsMenuProps) {
  const { hasFeature } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)

  const exportData = async (kind: 'pdf' | 'excel') => {
    if (!hasFeature('export')) {
      toast.warning('Export beschikbaar tijdens proefperiode of actief abonnement.')
      return
    }
    setBusy(true)
    try {
      let data = shifts
      if (data.length === 0) data = await getShiftsForPeriod(periodStart, periodEnd)
      if (data.length === 0) {
        toast.info('Geen diensten om te exporteren')
        return
      }
      const opts = { shifts: data, organizationName, periodLabel, employees, exportedAt: new Date() }
      if (kind === 'pdf') exportScheduleToPDF(opts)
      else exportScheduleToExcel(opts)
      toast.success(`Geëxporteerd als ${kind === 'pdf' ? 'PDF' : 'Excel'}`)
    } catch {
      toast.error('Export mislukt')
    } finally {
      setBusy(false)
    }
  }

  const clearMonth = async () => {
    if (shifts.length === 0) {
      toast.info('Geen diensten om te verwijderen')
      return
    }
    const ok = await confirm({
      title: 'Maand leegmaken?',
      message: `Alle ${shifts.length} diensten in ${periodLabel} worden verwijderd.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await clearMonthSchedule(monthAnchor)
      await onCleared()
      toast.success('Maand geleegd')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Mislukt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dropdown
      align="right"
      aria-label="Meer acties"
      trigger={
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', opacity: busy ? 0.6 : 1 }}
        >
          <MoreHorizontal className="h-4 w-4" />
          Meer
        </span>
      }
      items={[
        { id: 'publish', label: 'Rooster publiceren', onClick: onPublish, disabled: busy },
        { id: 'pdf', label: 'Export PDF', onClick: () => exportData('pdf'), disabled: busy },
        { id: 'excel', label: 'Export Excel', onClick: () => exportData('excel'), disabled: busy },
        { id: 'clear', label: 'Maand leegmaken', onClick: clearMonth, disabled: busy, danger: true },
      ]}
    />
  )
}
