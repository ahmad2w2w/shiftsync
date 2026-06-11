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
          <thead className="sticky top-0" style={{ background: '#111113' }}>
            <tr className="text-left text-zinc-500">
              <th className="px-3 py-2 font-medium">Datum</th>
              <th className="px-3 py-2 font-medium">Medewerkers beschikbaar</th>
              <th className="px-3 py-2 font-medium text-right">Aantal</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayAvail = availability.filter((a) => a.date === dateStr)
              return (
                <tr key={dateStr} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <td className="px-3 py-2 font-medium text-zinc-300 whitespace-nowrap">
                    {format(day, 'EEE d MMM', { locale: nl })}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">
                    {dayAvail.length === 0 ? (
                      <span className="text-zinc-700">—</span>
                    ) : (
                      dayAvail.map((a) => a.users?.full_name ?? '?').join(', ')
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-500">{dayAvail.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
