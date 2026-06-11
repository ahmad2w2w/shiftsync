import { cn } from '../../lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-brand-500 dark:border-white/10 dark:border-t-brand-400" />
    </div>
  )
}
