import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Search, CornerDownLeft } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Kbd } from './Kbd'

export interface Command {
  id: string
  label: string
  hint?: string
  group?: string
  icon?: ReactNode
  keywords?: string
  perform: () => void
}

interface CommandMenuProps {
  open: boolean
  onClose: () => void
  commands: Command[]
  placeholder?: string
}

export function CommandMenu({ open, onClose, commands, placeholder = 'Zoek of voer een actie uit...' }: CommandMenuProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 20)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''} ${c.group ?? ''}`.toLowerCase().includes(q)
    )
  }, [query, commands])

  const groups = useMemo(() => {
    const map = new Map<string, Command[]>()
    for (const c of filtered) {
      const g = c.group ?? 'Acties'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(c)
    }
    return Array.from(map.entries())
  }, [filtered])

  const flat = filtered

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = flat[active]
        if (cmd) { cmd.perform(); onClose() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, flat, active, onClose])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-index="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  let runningIndex = -1

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Commando-menu"
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl animate-scale-in"
        style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-5)', transformOrigin: 'top' }}
      >
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search className="h-5 w-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-4 text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {flat.length === 0 && (
            <p className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Geen resultaten voor "{query}"
            </p>
          )}
          {groups.map(([group, cmds]) => (
            <div key={group} className="mb-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-disabled)' }}>
                {group}
              </p>
              {cmds.map((cmd) => {
                runningIndex++
                const idx = runningIndex
                const isActive = idx === active
                return (
                  <button
                    key={cmd.id}
                    data-cmd-index={idx}
                    type="button"
                    onMouseMove={() => setActive(idx)}
                    onClick={() => { cmd.perform(); onClose() }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors'
                    )}
                    style={{
                      background: isActive ? 'var(--brand-muted)' : 'transparent',
                      color: isActive ? 'var(--brand-strong)' : 'var(--text-primary)',
                    }}
                  >
                    {cmd.icon && <span className="shrink-0">{cmd.icon}</span>}
                    <span className="flex-1 truncate font-medium">{cmd.label}</span>
                    {cmd.hint && (
                      <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>{cmd.hint}</span>
                    )}
                    {isActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
