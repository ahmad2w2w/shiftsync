import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('pwa-install-dismissed') === '1'
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferred || dismissed) return null

  const install = async () => {
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
      style={{ background: 'var(--brand-muted)', border: '1px solid rgba(59,130,246,0.2)' }}
    >
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
        <Download className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-strong)' }} />
        Voeg ShiftSync toe aan je startscherm voor sneller inklokken.
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={install}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: 'var(--brand-strong)' }}
        >
          Installeren
        </button>
        <button
          type="button"
          onClick={() => {
            setDismissed(true)
            localStorage.setItem('pwa-install-dismissed', '1')
          }}
          className="rounded-lg p-1.5"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Sluiten"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
