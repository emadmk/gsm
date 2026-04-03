'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Volume2, VolumeX } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'

interface StoryItem {
  type: 'image' | 'video'
  url: string
  caption?: string
  link?: string
}

interface Story {
  id: number
  title: string
  cover: string | null
  items: StoryItem[] | null
}

interface StoryViewerProps {
  stories: Story[]
  initialStoryIndex: number
  onClose: () => void
}

const SLIDE_DURATION = 5000

export default function StoryViewer({ stories, initialStoryIndex, onClose }: StoryViewerProps) {
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex)
  const [itemIndex, setItemIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [mediaLoaded, setMediaLoaded] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const elapsedRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const currentStory = stories[storyIndex]
  const items = (currentStory?.items as StoryItem[]) || []
  const currentItem = items[itemIndex]
  const isVideo = currentItem?.type === 'video'

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const goNext = useCallback(() => {
    if (itemIndex < items.length - 1) {
      setItemIndex((prev) => prev + 1)
      setProgress(0)
      setMediaLoaded(false)
      elapsedRef.current = 0
    } else if (storyIndex < stories.length - 1) {
      setStoryIndex((prev) => prev + 1)
      setItemIndex(0)
      setProgress(0)
      setMediaLoaded(false)
      elapsedRef.current = 0
    } else {
      onClose()
    }
  }, [itemIndex, items.length, storyIndex, stories.length, onClose])

  const goPrev = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((prev) => prev - 1)
      setProgress(0)
      setMediaLoaded(false)
      elapsedRef.current = 0
    } else if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1)
      const prevItems = (stories[storyIndex - 1]?.items as StoryItem[]) || []
      setItemIndex(Math.max(0, prevItems.length - 1))
      setProgress(0)
      setMediaLoaded(false)
      elapsedRef.current = 0
    }
  }, [itemIndex, storyIndex, stories])

  // Auto-advance timer for images
  useEffect(() => {
    if (!mediaLoaded || paused || isVideo) return

    clearTimer()
    startTimeRef.current = Date.now()
    const remaining = SLIDE_DURATION - elapsedRef.current

    timerRef.current = setInterval(() => {
      const now = Date.now()
      const total = elapsedRef.current + (now - startTimeRef.current)
      const pct = Math.min(total / SLIDE_DURATION, 1)
      setProgress(pct)

      if (pct >= 1) {
        clearTimer()
        goNext()
      }
    }, 30)

    return clearTimer
  }, [mediaLoaded, paused, isVideo, itemIndex, storyIndex, clearTimer, goNext])

  // Video progress tracking
  useEffect(() => {
    if (!isVideo || !videoRef.current || !mediaLoaded || paused) return

    const video = videoRef.current
    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress(video.currentTime / video.duration)
      }
    }
    const onEnded = () => goNext()

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
    }
  }, [isVideo, mediaLoaded, paused, goNext])

  // Pause/resume video
  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    if (paused) {
      videoRef.current.pause()
    } else if (mediaLoaded) {
      videoRef.current.play().catch(() => {})
    }
  }, [paused, isVideo, mediaLoaded])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goPrev() // RTL: right arrow goes to previous
          break
        case 'ArrowLeft':
          goNext() // RTL: left arrow goes to next
          break
        case 'Escape':
          onClose()
          break
        case ' ':
          e.preventDefault()
          setPaused((p) => !p)
          break
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setPaused(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setPaused(false)
    if (!touchStartRef.current) return

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    touchStartRef.current = null

    if (Math.abs(dy) > 120 && Math.abs(dy) > Math.abs(dx)) {
      onClose()
      return
    }

    // RTL swipe: swipe left = next story, swipe right = prev story
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  // Click left/right half to navigate
  const handleAreaClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    // RTL: right half = previous, left half = next
    if (x > rect.width / 2) {
      goPrev()
    } else {
      goNext()
    }
  }

  if (!currentStory || items.length === 0) {
    onClose()
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" dir="rtl">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Desktop: Previous story button */}
      {storyIndex > 0 && (
        <button
          onClick={() => {
            setStoryIndex((p) => p - 1)
            setItemIndex(0)
            setProgress(0)
            setMediaLoaded(false)
            elapsedRef.current = 0
          }}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Desktop: Next story button */}
      {storyIndex < stories.length - 1 && (
        <button
          onClick={() => {
            setStoryIndex((p) => p + 1)
            setItemIndex(0)
            setProgress(0)
            setMediaLoaded(false)
            elapsedRef.current = 0
          }}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Story container */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-[420px] max-h-[750px] md:rounded-2xl overflow-hidden bg-gray-900"
        onClick={handleAreaClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-3">
          {items.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    idx < itemIndex
                      ? '100%'
                      : idx === itemIndex
                        ? `${progress * 100}%`
                        : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 right-0 left-0 z-10 flex items-center gap-3 px-4 pt-3">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/50 bg-gray-700 flex-shrink-0">
            {currentStory.cover && (
              <img
                src={getImageUrl(currentStory.cover)}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <span className="text-white text-sm font-medium drop-shadow">{currentStory.title}</span>

          {isVideo && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMuted((m) => !m)
              }}
              className="mr-auto p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Media content */}
        <div className="w-full h-full flex items-center justify-center">
          {isVideo ? (
            <video
              ref={videoRef}
              key={`${storyIndex}-${itemIndex}`}
              src={getImageUrl(currentItem.url)}
              muted={muted}
              playsInline
              autoPlay
              className="w-full h-full object-contain"
              onLoadedData={() => setMediaLoaded(true)}
            />
          ) : (
            <img
              key={`${storyIndex}-${itemIndex}`}
              src={getImageUrl(currentItem.url)}
              alt={currentItem.caption || ''}
              className="w-full h-full object-contain"
              onLoad={() => setMediaLoaded(true)}
              draggable={false}
            />
          )}

          {/* Loading spinner */}
          {!mediaLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Caption */}
        {currentItem.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-5 pt-12">
            <p className="text-white text-sm leading-relaxed drop-shadow">{currentItem.caption}</p>
          </div>
        )}

        {/* Link overlay */}
        {currentItem.link && (
          <a
            href={currentItem.link}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-white text-gray-900 rounded-full text-sm font-medium shadow-lg hover:bg-gray-100 transition-colors"
          >
            مشاهده بیشتر
          </a>
        )}

        {/* Pause indicator */}
        {paused && !isVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-6 bg-white rounded" />
                <div className="w-1.5 h-6 bg-white rounded" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
