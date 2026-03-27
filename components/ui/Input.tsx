import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block subtitle-sm text-gray-700 mb-1.5">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'h-11 w-full rounded-lg border border-gray-200 bg-white px-3 body-sm text-gray-800 placeholder-gray-300 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 caption text-red-500">{error}</p>}
        {helperText && !error && <p className="mt-1 caption text-gray-400">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
