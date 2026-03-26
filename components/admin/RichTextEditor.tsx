'use client'

import { useCallback, useRef } from 'react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link,
  Image,
  List,
  ListOrdered,
  Code,
  Quote,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'محتوای مطلب را وارد کنید...',
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertAtCursor = useCallback(
    (before: string, after: string = '') => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const newText =
        value.substring(0, start) +
        before +
        selectedText +
        after +
        value.substring(end)
      onChange(newText)

      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + before.length + selectedText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [value, onChange]
  )

  const toolbarButtons = [
    {
      icon: Bold,
      title: 'بولد',
      action: () => insertAtCursor('**', '**'),
    },
    {
      icon: Italic,
      title: 'ایتالیک',
      action: () => insertAtCursor('*', '*'),
    },
    {
      icon: Heading1,
      title: 'تیتر ۱',
      action: () => insertAtCursor('\n## ', '\n'),
    },
    {
      icon: Heading2,
      title: 'تیتر ۲',
      action: () => insertAtCursor('\n### ', '\n'),
    },
    {
      icon: Link,
      title: 'لینک',
      action: () => insertAtCursor('[', '](url)'),
    },
    {
      icon: Image,
      title: 'تصویر',
      action: () => insertAtCursor('![alt](', ')'),
    },
    {
      icon: List,
      title: 'لیست',
      action: () => insertAtCursor('\n- ', '\n'),
    },
    {
      icon: ListOrdered,
      title: 'لیست شماره‌دار',
      action: () => insertAtCursor('\n1. ', '\n'),
    },
    {
      icon: Code,
      title: 'کد',
      action: () => insertAtCursor('`', '`'),
    },
    {
      icon: Quote,
      title: 'نقل قول',
      action: () => insertAtCursor('\n> ', '\n'),
    },
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
          >
            <btn.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[400px] p-4 text-sm leading-7 resize-y focus:outline-none font-mono"
        dir="rtl"
      />
    </div>
  )
}
