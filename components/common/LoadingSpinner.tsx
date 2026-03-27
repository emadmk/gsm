'use client'

interface LoadingSpinnerProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ text, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          border-gray-200
          border-t-primary-500
          animate-spin
        `}
        style={{ borderWidth: size === 'sm' ? 2 : size === 'md' ? 3 : 4 }}
      />
      {text && (
        <p className="body-sm text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  )
}
