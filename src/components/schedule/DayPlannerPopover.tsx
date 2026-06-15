import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Availability, LeaveRequest, Shift, User } from '../../types/database'
import { DayPlannerPanel } from './DayPlannerPanel'

const POPOVER_W = 400
const GAP = 10

function computePosition(rect: DOMRect) {
  const maxH = Math.min(560, window.innerHeight - 24)
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = rect.right + GAP
  let top = rect.top

  if (left + POPOVER_W > vw - 12) {
    left = rect.left - POPOVER_W - GAP
  }
  if (left < 12) {
    left = Math.max(12, (vw - POPOVER_W) / 2)
    top = rect.bottom + GAP
  }

  top = Math.max(12, Math.min(top, vh - maxH - 12))

  return { top, left, maxH }
}

interface DayPlannerPopoverProps {
  date: string
  anchor: DOMRect
  shifts: Shift[]
  employees: User[]
  availability: (Availability & { users?: { full_name: string } })[]
  leave: LeaveRequest[]
  onSaved: () => Promise<void>
  onClose: () => void
}

export function DayPlannerPopover({
  date,
  anchor,
  onClose,
  ...panelProps
}: DayPlannerPopoverProps) {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  const [pos, setPos] = useState(() => computePosition(anchor))

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useLayoutEffect(() => {
    if (mobile) return
    const update = () => {
      const el = document.querySelector(`[data-calendar-day="${date}"]`)
      const rect = el?.getBoundingClientRect() ?? anchor
      setPos(computePosition(rect))
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [date, anchor, mobile])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const panel = (
    <DayPlannerPanel
      {...panelProps}
      date={date}
      compact
      onClose={onClose}
    />
  )

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[90] animate-fade-in"
        style={{ background: 'rgba(15,23,42,0.25)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      {mobile ? (
        <div
          className="fixed inset-x-0 bottom-0 z-[100] max-h-[88vh] overflow-y-auto rounded-t-2xl animate-slide-up"
          style={{
            background: 'var(--surface-card)',
            boxShadow: '0 -8px 40px rgba(15,23,42,0.15)',
          }}
          role="dialog"
          aria-modal="true"
        >
          {panel}
        </div>
      ) : (
        <div
          className="fixed z-[100] overflow-hidden rounded-2xl animate-fade-in"
          style={{
            top: pos.top,
            left: pos.left,
            width: POPOVER_W,
            maxHeight: pos.maxH,
            overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)',
          }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {panel}
        </div>
      )}
    </>,
    document.body
  )
}
