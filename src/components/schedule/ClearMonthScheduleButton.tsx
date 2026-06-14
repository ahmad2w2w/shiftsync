import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { clearMonthSchedule } from '../../services/monthPlanner'
import { Button } from '../ui/Button'

interface ClearMonthScheduleButtonProps {
  monthAnchor: Date
  shiftCount: number
  periodLabel: string
  onCleared: () => Promise<void>
  size?: 'sm' | 'md'
  className?: string
}

export function ClearMonthScheduleButton({
  monthAnchor,
  shiftCount,
  periodLabel,
  onCleared,
  size = 'sm',
  className,
}: ClearMonthScheduleButtonProps) {
  const confirm = useConfirm()
  const toast = useToast()
  const [clearing, setClearing] = useState(false)

  const handleClear = async () => {
    if (shiftCount === 0) {
      toast.info('Geen diensten om te verwijderen in deze maand')
      return
    }

    const ok = await confirm({
      title: 'Hele maand leegmaken?',
      message: `Alle ${shiftCount} dienst(en) in ${periodLabel} worden permanent verwijderd. Medewerkers zien daarna geen rooster meer voor deze maand. Je kunt daarna opnieuw beginnen met plannen.`,
      confirmLabel: 'Alles verwijderen',
      danger: true,
    })
    if (!ok) return

    setClearing(true)
    try {
      await clearMonthSchedule(monthAnchor)
      await onCleared()
      toast.success(`${shiftCount} dienst(en) verwijderd — maand is leeg`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Leegmaken mislukt')
    } finally {
      setClearing(false)
    }
  }

  return (
    <Button
      size={size}
      variant="ghost"
      loading={clearing}
      disabled={shiftCount === 0}
      onClick={handleClear}
      className={className}
      style={{ color: shiftCount === 0 ? undefined : '#EF4444' }}
    >
      <Trash2 className="h-4 w-4" />
      Maand leegmaken
    </Button>
  )
}
