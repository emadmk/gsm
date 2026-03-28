import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'default' | 'success' | 'warning'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className,
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary-500/[0.08] text-primary-500',
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-20 text-green-500',
    warning: 'bg-yellow-20 text-yellow-500',
  }
  const sizes = {
    sm: 'h-5 px-2 text-[0.6875rem]',
    md: 'h-[1.375rem] px-3 caption',
  }

  return (
    <span className={cn('inline-flex items-center rounded-sm', variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}
