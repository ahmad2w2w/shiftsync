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
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-3 py-2">Datum</th>
              <th className="px-3 py-2">Medewerkers beschikbaar</th>
              <th className="px-3 py-2 text-right">Aantal</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayAvail = availability.filter((a) => a.date === dateStr)
              return (
                <tr key={dateStr} className="border-t border-gray-50">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {format(day, 'EEE d MMM', { locale: nl })}
                  </td>
                  <td className="px-3 py-2">
                    {dayAvail.length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className="text-navy-800">
                        {dayAvail.map((a) => a.users?.full_name ?? '?').join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">{dayAvail.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
