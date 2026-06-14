import { Link } from 'react-router-dom'
import { ArrowLeft, Zap } from 'lucide-react'
import { PublicFooter } from './PublicFooter'

export function LegalLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="marketing-light min-h-screen flex flex-col" style={{ background: 'var(--surface-page)' }}>
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--color-navy)' }}>ShiftSync</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-brand-600"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Terug
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>{title}</h1>
        <div
          className="prose-legal mt-8 space-y-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {children}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
