'use client'

import { useRouter } from 'next/navigation'

export default function AuthorLink({
  slug,
  name,
  className,
}: {
  slug: string
  name: string
  className?: string
}) {
  const router = useRouter()

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/author/${slug}`)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
          router.push(`/author/${slug}`)
        }
      }}
      className={className || 'caption text-gray-600 hover:text-primary-500 transition-colors cursor-pointer'}
    >
      {name}
    </span>
  )
}
