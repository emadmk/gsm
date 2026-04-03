'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/utils'
import StoryViewer from './StoryViewer'

interface StoryData {
  id: number
  title: string
  cover: string | null
  items: unknown
}

interface StoryItem {
  type: 'image' | 'video'
  url: string
  caption?: string
  link?: string
}

interface NormalizedStory {
  id: number
  title: string
  cover: string | null
  items: StoryItem[] | null
}

interface StoriesSliderProps {
  stories: StoryData[]
}

export default function StoriesSlider({ stories }: StoriesSliderProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const normalized: NormalizedStory[] = stories.map((s) => ({
    ...s,
    items: Array.isArray(s.items) ? (s.items as StoryItem[]) : null,
  }))

  const viewableStories = normalized.filter(
    (s) => s.items && s.items.length > 0
  )

  if (viewableStories.length === 0) return null

  const handleOpen = (index: number) => {
    setActiveIndex(index)
    setViewerOpen(true)
  }

  return (
    <>
      <section className="py-4 fade-section">
        <div className="flex gap-4 pb-2 overflow-x-auto no-scrollbar">
          {viewableStories.map((story, index) => (
            <button
              key={story.id}
              type="button"
              onClick={() => handleOpen(index)}
              className="flex flex-col items-center flex-shrink-0 group"
            >
              <div className="
                w-16 h-16 md:w-20 md:h-20 rounded-full
                ring-2 ring-primary-500 ring-offset-2
                overflow-hidden bg-gray-100
                transition-transform duration-300
                group-hover:scale-105 group-hover:ring-primary-600
              ">
                <Image
                  src={getImageUrl(story.cover)}
                  alt={story.title}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="caption text-gray-700 mt-1.5 max-w-[5rem] text-center truncate group-hover:text-primary-500 transition-colors">
                {story.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {viewerOpen && (
        <StoryViewer
          stories={viewableStories}
          initialStoryIndex={activeIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}
