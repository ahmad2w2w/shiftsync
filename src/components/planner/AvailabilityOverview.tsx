import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Availability } from '../../types/database'
import { getMonthRange } from '../../lib/utils'
import { Card, CardHeader } from '../ui/Card'

interface AvailabilityOverviewProps {
  monthAnchor: Date
  availability: (Availability & { users?: { full_name: string } })[]
}

export function AvailabilityOverview({ monthAnchor, availability }: AvailabilityOverviewProps) {
  const { days } = getMonthRange(monthAnchor)

  return (
    <Card>
      <CardHeader
        title="Beschikbaarheid deze maand"
        subtitle="Overzicht per dag — wie heeft zich beschikbaar gemeld"
      />
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead
            className="sticky top-0"
            style={{ background: 'var(--surface-card)' }}
          >
            <tr className="text-left">
              <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Datum</th>
              <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Medewerkers beschikbaar</th>
              <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide text-right" style={{ color: 'var(--text-muted)' }}>Aantal</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayAvail = availability.filter((a) => a.date === dateStr)
              return (
                <tr key={dateStr} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {format(day, 'EEE d MMM', { locale: nl })}
                  </td>
                  <td className="px-3 py-2" style={{ color: dayAvail.length === 0 ? 'var(--text-disabled)' : 'var(--text-secondary)' }}>
                    {dayAvail.length === 0 ? '—' : dayAvail.map((a) => a.users?.full_name ?? '?').join(', ')}
                  </td>
                  <td className="px-3 py-2 text-right" style={{ color: 'var(--text-muted)' }}>{dayAvail.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
