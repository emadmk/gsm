'use client'

import { useState } from 'react'
import { Share2, Check, Link } from 'lucide-react'

interface ShareButtonProps {
  url?: string
  title?: string
  className?: string
}

export default function ShareButton({ url, title, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = url || window.location.href
    const shareTitle = title || document.title

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`flex-center gap-1 cursor-pointer transition-colors hover:text-primary-500 ${className}`}
      title="اشتراک‌گذاری"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="caption text-green-500">لینک کپی شد</span>
        </>
      ) : (
        <Share2 className="w-4 h-4" />
      )}
    </button>
  )
}
