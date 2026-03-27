'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="بازگشت به بالا"
      className={`
        fixed bottom-6 left-6 z-50
        w-12 h-12 rounded-full
        bg-primary-500 text-white shadow-lg
        flex-center
        transition-all duration-300 ease-out
        hover:bg-primary-600 hover:scale-110 hover:shadow-xl
        active:scale-95
        ${visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
        }
      `}
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  )
}
