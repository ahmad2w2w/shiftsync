import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Availability, LeaveRequest, Shift, User } from '../../types/database'
import { DayPlannerPanel } from './DayPlannerPanel'

const POPOVER_W = 520
const POPOVER_MAX_H = 340
const GAP = 8
const PAD = 12

export type PopoverPoint = { x: number; y: number }

function fits(left: number, top: number, vw: number, vh: number) {
  return (
    left >= PAD &&
    top >= PAD &&
    left + POPOVER_W <= vw - PAD &&
    top + POPOVER_MAX_H <= vh - PAD
  )
}

function computePosition(rect: DOMRect, point?: PopoverPoint) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const candidates = [
    { top: rect.bottom + GAP, left: rect.left },
    { top: rect.bottom + GAP, left: rect.right - POPOVER_W },
    { top: rect.top - POPOVER_MAX_H - GAP, left: rect.left },
    { top: rect.top, left: rect.right + GAP },
    { top: rect.top, left: rect.left - POPOVER_W - GAP },
  ]

  if (point) {
    candidates.unshift(
      { top: point.y + GAP, left: point.x + GAP },
      { top: point.y - POPOVER_MAX_H - GAP, left: point.x - POPOVER_W / 2 },
    )
  }

  for (const c of candidates) {
    const left = Math.max(PAD, Math.min(c.left, vw - POPOVER_W - PAD))
    const top = Math.max(PAD, Math.min(c.top, vh - POPOVER_MAX_H - PAD))
    if (fits(left, top, vw, vh)) return { top, left, maxH: POPOVER_MAX_H }
  }

  return {
    top: Math.max(PAD, Math.min(rect.bottom + GAP, vh - POPOVER_MAX_H - PAD)),
    left: Math.max(PAD, Math.min(rect.left, vw - POPOVER_W - PAD)),
    maxH: POPOVER_MAX_H,
  }
}

interface DayPlannerPopoverProps {
  date: string
  anchor: DOMRect
  point?: PopoverPoint
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
  point,
  onClose,
  ...panelProps
}: DayPlannerPopoverProps) {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  const [pos, setPos] = useState(() => computePosition(anchor, point))

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
      setPos(computePosition(rect, point))
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [date, anchor, point, mobile])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[90] animate-fade-in"
        style={{ background: 'rgba(15,23,42,0.2)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      {mobile ? (
        <div
          className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl animate-slide-up"
          style={{
            background: 'var(--surface-card)',
            boxShadow: '0 -8px 40px rgba(15,23,42,0.15)',
          }}
          role="dialog"
          aria-modal="true"
        >
          <DayPlannerPanel {...panelProps} date={date} compact onClose={onClose} />
        </div>
      ) : (
        <div
          className="fixed z-[100] flex flex-col overflow-hidden rounded-2xl animate-fade-in"
          style={{
            top: pos.top,
            left: pos.left,
            width: POPOVER_W,
            maxHeight: pos.maxH,
            background: 'var(--surface-card)',
            boxShadow: '0 16px 48px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)',
          }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <DayPlannerPanel {...panelProps} date={date} compact onClose={onClose} />
        </div>
      )}
    </>,
    document.body
  )
}
