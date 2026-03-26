'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchBoxProps {
  defaultValue?: string
  className?: string
  placeholder?: string
}

export default function SearchBox({ defaultValue = '', className = '', placeholder }: SearchBoxProps) {
  const [query, setQuery] = useState(defaultValue)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full bg-primary-20 rounded-lg p-3 pr-10 border border-gray-200 caption placeholder-gray-300 outline-none focus:border-primary-500"
        placeholder={placeholder || 'عبارت خود را جستجو کنید'}
      />
      <Search className="w-5 h-5 absolute right-3 top-3.5 text-gray-400" />
    </form>
  )
}
