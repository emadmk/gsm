import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'default' | 'success' | 'warning'
  className?: string
}

export default function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-500/[0.08] text-primary-500',
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-20 text-green-500',
    warning: 'bg-yellow-20 text-yellow-500',
  }

  return (
    <span className={cn('inline-flex items-center h-[1.375rem] px-3 rounded-sm caption', variants[variant], className)}>
      {children}
    </span>
  )
}
