import { cn } from '../../lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-16 w-16 text-xl',
}

const dotSize: Record<AvatarSize, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
}

const palette = [
  ['#3B82F6', '#1D4ED8'],
  ['#8B5CF6', '#6D28D9'],
  ['#10B981', '#047857'],
  ['#F59E0B', '#B45309'],
  ['#EF4444', '#B91C1C'],
  ['#06B6D4', '#0E7490'],
  ['#EC4899', '#BE185D'],
]

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: AvatarSize
  status?: 'online' | 'offline' | 'busy' | null
  className?: string
  ring?: boolean
}

export function Avatar({ name, src, size = 'md', status, className, ring }: AvatarProps) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  const [from, to] = colorFor(name ?? '?')

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt=""
          className={cn(
            'rounded-full object-cover',
            sizeMap[size],
            ring && 'ring-2 ring-[var(--surface-card)]'
          )}
        />
      ) : (
        <span
          className={cn(
            'flex items-center justify-center rounded-full font-semibold text-white',
            sizeMap[size],
            ring && 'ring-2 ring-[var(--surface-card)]'
          )}
          style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
        >
          {initials || '?'}
        </span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--surface-card)]',
            dotSize[size]
          )}
          style={{
            background:
              status === 'online'
                ? 'var(--color-success)'
                : status === 'busy'
                  ? 'var(--color-warning)'
                  : 'var(--text-disabled)',
          }}
        />
      )}
    </span>
  )
}
