import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useOrganization } from '../../context/OrganizationContext'
import { useToast } from '../../context/ToastContext'
import { exportScheduleToExcel, exportScheduleToPDF } from '../../services/export'
import { getShiftsForPeriod } from '../../services/shifts'
import type { Shift, User } from '../../types/database'
import { Button } from '../ui/Button'
import { Dropdown } from '../ui/Dropdown'

interface ScheduleExportButtonProps {
  shifts: Shift[]
  employees: User[]
  organizationName: string
  periodLabel: string
  periodStart: Date
  periodEnd: Date
  size?: 'sm' | 'md'
}

export function ScheduleExportButton({
  shifts,
  employees,
  organizationName,
  periodLabel,
  periodStart,
  periodEnd,
}: ScheduleExportButtonProps) {
  const { hasFeature } = useOrganization()
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const canExport = hasFeature('export')

  const runExport = async (kind: 'pdf' | 'excel') => {
    if (!canExport) {
      toast.warning('Export is beschikbaar tijdens je proefperiode of actief abonnement.')
      return
    }

    setExporting(true)
    try {
      let data = shifts
      if (data.length === 0) {
        data = await getShiftsForPeriod(periodStart, periodEnd)
      }
      if (data.length === 0) {
        toast.info('Geen diensten om te exporteren in deze periode')
        return
      }

      const opts = {
        shifts: data,
        organizationName,
        periodLabel,
        employees,
        exportedAt: new Date(),
      }

      if (kind === 'pdf') exportScheduleToPDF(opts)
      else exportScheduleToExcel(opts)

      toast.success(`Rooster geëxporteerd als ${kind === 'pdf' ? 'PDF' : 'Excel'}`)
    } catch {
      toast.error('Export mislukt')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dropdown
      align="right"
      aria-label="Rooster exporteren"
      trigger={
        <span
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            opacity: exporting ? 0.7 : 1,
          }}
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporteren…' : 'Exporteren'}
        </span>
      }
      items={[
        {
          id: 'pdf',
          label: 'PDF — volledig rooster',
          onClick: () => runExport('pdf'),
          disabled: exporting,
        },
        {
          id: 'excel',
          label: 'Excel — diensten + samenvatting',
          onClick: () => runExport('excel'),
          disabled: exporting,
        },
      ]}
    />
  )
}

/** Inline PDF + Excel buttons for wider toolbars */
export function ScheduleExportActions(props: ScheduleExportButtonProps) {
  const { hasFeature } = useOrganization()
  const toast = useToast()
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const canExport = hasFeature('export')

  const runExport = async (kind: 'pdf' | 'excel') => {
    if (!canExport) {
      toast.warning('Export is beschikbaar tijdens je proefperiode of actief abonnement.')
      return
    }

    setExporting(kind)
    try {
      let data = props.shifts
      if (data.length === 0) {
        data = await getShiftsForPeriod(props.periodStart, props.periodEnd)
      }
      if (data.length === 0) {
        toast.info('Geen diensten om te exporteren in deze periode')
        return
      }

      const opts = {
        shifts: data,
        organizationName: props.organizationName,
        periodLabel: props.periodLabel,
        employees: props.employees,
        exportedAt: new Date(),
      }

      if (kind === 'pdf') exportScheduleToPDF(opts)
      else exportScheduleToExcel(opts)

      toast.success(`Rooster geëxporteerd als ${kind === 'pdf' ? 'PDF' : 'Excel'}`)
    } catch {
      toast.error('Export mislukt')
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      <Button
        size={props.size ?? 'sm'}
        variant="secondary"
        loading={exporting === 'pdf'}
        onClick={() => runExport('pdf')}
      >
        <FileText className="h-4 w-4" /> PDF
      </Button>
      <Button
        size={props.size ?? 'sm'}
        variant="secondary"
        loading={exporting === 'excel'}
        onClick={() => runExport('excel')}
      >
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </Button>
    </>
  )
}
