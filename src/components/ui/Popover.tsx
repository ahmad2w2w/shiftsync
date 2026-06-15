import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void; ref: (el: HTMLElement | null) => void }) => ReactNode
  children: (props: { close: () => void }) => ReactNode
  align?: 'start' | 'end'
  width?: number
  className?: string
}

export function Popover({ trigger, children, align = 'end', width = 320, className }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; panelWidth: number }>({ top: 0, left: 0, panelWidth: width })
  const anchorRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const reposition = () => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const panelWidth = Math.min(width, vw - 24)
    let left = align === 'end' ? r.right - panelWidth : r.left
    left = Math.max(12, Math.min(left, vw - panelWidth - 12))
    setPos({ top: r.bottom + 8, left, panelWidth })
  }

  useLayoutEffect(() => {
    if (!open) return
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      {trigger({
        open,
        toggle: () => setOpen((v) => !v),
        ref: (el) => { anchorRef.current = el },
      })}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className={cn('fixed z-[120] animate-scale-in overflow-hidden rounded-2xl', className)}
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.panelWidth,
              maxWidth: 'calc(100vw - 24px)',
              transformOrigin: 'top',
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-4)',
            }}
            role="dialog"
          >
            {children({ close: () => setOpen(false) })}
          </div>,
          document.body
        )}
    </>
  )
}
