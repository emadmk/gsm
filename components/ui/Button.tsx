import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'link' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export default function Button({ children, variant = 'primary', size = 'md', href, className, onClick, type = 'button', disabled, icon, iconPosition = 'right' }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 transition-all duration-200 font-bold rounded-lg'
  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
    link: 'text-primary-500 hover:text-primary-600',
    ghost: 'text-gray-600 hover:bg-gray-100',
  }
  const sizeClasses = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' }
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className)

  if (href) {
    return <Link href={href} className={classes}>{iconPosition === 'right' && icon}{children}{iconPosition === 'left' && icon}</Link>
  }
  return <button type={type} onClick={onClick} disabled={disabled} className={classes}>{iconPosition === 'right' && icon}{children}{iconPosition === 'left' && icon}</button>
}
